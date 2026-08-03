export type GLPITicket = {
  id: number;
  name: string;
  date: string;               // abertura "YYYY-MM-DD HH:mm:ss"
  date_mod: string;           // última modificação
  date_solve: string | null;
  closedate: string | null;
  status: number;             // 1=Novo 2=Em curso(atrib) 3=Em curso(plan) 4=Pendente 5=Resolvido 6=Fechado
  priority: number;           // 1=MuitoBaixa … 6=Muito Alta
  urgency: number;
  impact: number;
  type: number;               // 1=Incidente 2=Requisição
  entities_id: number | string;       // string se expand_dropdowns
  itilcategories_id: number | string; // string se expand_dropdowns
  content: string;
  users_id_recipient: number;
};

export type GLPITicketUser = {
  id: number;
  tickets_id: number;
  users_id: number;
  type: number; // 1=Solicitante 2=Atribuído 3=Observador
  use_notification: number;
};

export type GLPIEntity = {
  id: number;
  name: string;
  completename: string;
  level: number;
  entities_id: number;
};

export type GLPIUser = {
  id: number;
  name: string;      // login
  firstname: string;
  realname: string;
  is_active: number;
};

export type GLPIFollowup = {
  id: number;
  items_id: number;
  date: string;
  date_mod: string;
  users_id: number;
  content: string;
  is_private: number;
};
