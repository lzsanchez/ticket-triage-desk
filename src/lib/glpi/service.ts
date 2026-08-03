import { glpiFetch } from "./client";
import { adaptTicket, adaptEntity } from "./adapter";
import type { GLPITicket, GLPIEntity, GLPITicketUser, GLPIUser } from "./types";
import type { Chamado, Cliente } from "@/types";

export type GLPIFetchResult = {
  chamados: Chamado[];
  clientes: Cliente[];
  glpiUsers: GLPIUser[];
};

// Mapeamento de login/nome GLPI → ID interno do app
// Ajuste conforme os logins reais no Mobdesk
const GLPI_USER_MAP: Record<string, string> = {
  // login GLPI → id interno
  luciano: "luciano",
  pedro: "pedro",
  priscila: "priscila",
  // variações comuns
  "luciano.sanchez": "luciano",
  "luciano.carpio": "luciano",
  "pedro.melo": "pedro",
  "priscila.guanaz": "priscila",
};

function mapGLPIUserId(glpiUsers: GLPIUser[], glpiId: number | null): string | null {
  if (!glpiId) return null;
  const user = glpiUsers.find((u) => u.id === glpiId);
  if (!user) return null;
  const login = user.name.toLowerCase();
  const firstName = user.firstname?.toLowerCase() ?? "";
  return GLPI_USER_MAP[login] ?? GLPI_USER_MAP[firstName] ?? null;
}

export async function fetchGLPIData(): Promise<GLPIFetchResult> {
  // Buscar tudo em paralelo
  const [rawTickets, rawEntities, rawTicketUsers, rawUsers] = await Promise.all([
    glpiFetch<GLPITicket[] | { ERROR: string }>(
      "Ticket?expand_dropdowns=true&get_hateoas=false&range=0-499",
    ),
    glpiFetch<GLPIEntity[] | { ERROR: string }>(
      "Entity?range=0-499&get_hateoas=false",
    ),
    glpiFetch<GLPITicketUser[] | { ERROR: string }>(
      "Ticket_User?range=0-4999&get_hateoas=false",
    ),
    glpiFetch<GLPIUser[] | { ERROR: string }>(
      "User?range=0-199&get_hateoas=false&only_id=false",
    ),
  ]);

  const tickets = Array.isArray(rawTickets) ? rawTickets : [];
  const entities = Array.isArray(rawEntities) ? rawEntities : [];
  const ticketUsers = Array.isArray(rawTicketUsers) ? rawTicketUsers : [];
  const glpiUsers = Array.isArray(rawUsers) ? rawUsers : [];

  // Montar mapa ticketId → usuário atribuído (type 2)
  const assignedMap = new Map<number, number>();
  for (const tu of ticketUsers) {
    if (tu.type === 2) {
      assignedMap.set(tu.tickets_id, tu.users_id);
    }
  }

  const chamados: Chamado[] = tickets.map((t) => {
    const glpiUserId = assignedMap.get(t.id) ?? null;
    const tecnicoId = mapGLPIUserId(glpiUsers, glpiUserId);
    return adaptTicket(t, tecnicoId);
  });

  const clientes: Cliente[] = entities.map(adaptEntity);

  return { chamados, clientes, glpiUsers };
}
