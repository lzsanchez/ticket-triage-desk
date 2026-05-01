export type UserRole = "gestor" | "analista";

export type User = {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
};

export const MOCK_USERS: User[] = [
  { id: "luciano", name: "Luciano Sanchez", initials: "LS", role: "gestor" },
  { id: "pedro", name: "Pedro Melo", initials: "PM", role: "analista" },
  { id: "priscila", name: "Priscila Guanaz", initials: "PG", role: "analista" },
];
