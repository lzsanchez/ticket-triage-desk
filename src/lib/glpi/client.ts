const BASE = (import.meta.env.VITE_GLPI_BASE_URL as string) ?? "https://mobdesk.mobitsolucoes.com";
const USER_TOKEN = (import.meta.env.VITE_GLPI_USER_TOKEN as string) ?? "";

let sessionToken: string | null = null;
let initInFlight: Promise<void> | null = null;

async function ensureSession(): Promise<void> {
  if (sessionToken) return;
  if (initInFlight) return initInFlight;

  initInFlight = fetch(`${BASE}/apirest.php/initSession`, {
    headers: { Authorization: `user_token ${USER_TOKEN}` },
  })
    .then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.session_token) {
        throw new Error(`GLPI initSession falhou: ${r.status} — ${JSON.stringify(data)}`);
      }
      sessionToken = data.session_token as string;
    })
    .finally(() => {
      initInFlight = null;
    });

  return initInFlight;
}

export async function glpiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureSession();

  const res = await fetch(`${BASE}/apirest.php/${path}`, {
    ...init,
    headers: {
      "Session-Token": sessionToken!,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  // Sessão expirada — tentar reiniciar uma vez
  if (res.status === 401) {
    sessionToken = null;
    await ensureSession();
    return glpiFetch<T>(path, init);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GLPI ${path}: HTTP ${res.status} — ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function killSession(): Promise<void> {
  if (!sessionToken) return;
  const token = sessionToken;
  sessionToken = null;
  await fetch(`${BASE}/apirest.php/killSession`, {
    headers: { "Session-Token": token },
  }).catch(() => {});
}
