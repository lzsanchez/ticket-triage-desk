import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOCK_USERS, type User } from "./users";

type AuthContextValue = {
  user: User | null;
  login: (id: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "fdl.auth.userId";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.localStorage.getItem(STORAGE_KEY);
    if (id) {
      const found = MOCK_USERS.find((u) => u.id === id) ?? null;
      setUser(found);
    }
  }, []);

  const login = (id: string) => {
    const found = MOCK_USERS.find((u) => u.id === id);
    if (!found) return;
    window.localStorage.setItem(STORAGE_KEY, found.id);
    setUser(found);
  };

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
