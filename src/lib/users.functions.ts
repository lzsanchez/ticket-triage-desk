import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SeedUser = {
  email: string;
  password: string;
  slug: string;
  nome: string;
  iniciais: string;
  role: "gestor" | "analista";
};

const SEED: SeedUser[] = [
  { email: "luciano.sanchez@mobit.com.br", password: "Mobit@2026", slug: "luciano", nome: "Luciano Sanchez", iniciais: "LS", role: "gestor" },
  { email: "pedro.melo@mobit.com.br", password: "Mobit@2026", slug: "pedro", nome: "Pedro Melo", iniciais: "PM", role: "analista" },
  { email: "priscila.guanaz@mobit.com.br", password: "Mobit@2026", slug: "priscila", nome: "Priscila Guanaz", iniciais: "PG", role: "analista" },
];

/** Cria os 3 usuários padrão. Só funciona se não houver nenhum profile ainda (zero-state safety). */
export const seedInitialUsers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count, error: countErr } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (countErr) throw new Error(countErr.message);
  if ((count ?? 0) > 0) {
    return { ok: false, message: "Usuários já existem. Seed bloqueado." };
  }

  const created: string[] = [];
  for (const u of SEED) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { slug: u.slug, nome: u.nome, iniciais: u.iniciais, role: u.role },
    });
    if (error) throw new Error(`${u.email}: ${error.message}`);
    created.push(u.email);
  }
  return { ok: true, created, defaultPassword: "Mobit@2026" };
});

/** Cria um novo usuário. Apenas gestor. */
export const createUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; password: string; nome: string; iniciais: string; slug: string; role: "gestor" | "analista" }) => {
    if (!data.email || !data.password || data.password.length < 8) throw new Error("Email e senha (8+ caracteres) obrigatórios");
    if (!data.nome || !data.slug || !data.iniciais) throw new Error("Nome, slug e iniciais obrigatórios");
    if (data.role !== "gestor" && data.role !== "analista") throw new Error("Role inválido");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isGestor, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "gestor",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isGestor) throw new Error("Apenas gestores podem criar usuários");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { slug: data.slug, nome: data.nome, iniciais: data.iniciais, role: data.role },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
