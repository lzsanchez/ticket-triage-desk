import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "gestor" | "analista";

export type User = {
  id: string; // slug (compatível com mock data: "luciano", "pedro", "priscila")
  authId: string;
  name: string;
  initials: string;
  role: UserRole;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(authId: string): Promise<User | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, slug, nome, iniciais, email")
    .eq("user_id", authId)
    .maybeSingle();
  if (!profile) return null;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authId);
  const role: UserRole = roles?.some((r) => r.role === "gestor") ? "gestor" : "analista";
  return {
    id: profile.slug,
    authId: profile.user_id,
    name: profile.nome,
    initials: profile.iniciais,
    email: profile.email,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "INITIAL_SESSION") return;
      if (session?.user) {
        // defer to avoid deadlock
        setTimeout(() => {
          loadProfile(session.user.id).then((u) => {
            setUser(u);
            setLoading(false);
          });
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
