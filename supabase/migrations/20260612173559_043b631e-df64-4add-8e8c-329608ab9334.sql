
-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('gestor', 'analista');

-- Profiles: 1:1 com auth.users
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  iniciais TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles em tabela separada
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer para evitar recursão RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Policies profiles: todos autenticados leem (lista de técnicos); só o dono atualiza dados próprios
CREATE POLICY "profiles_select_all_auth" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies user_roles: todos autenticados leem (precisa pra UI saber quem é gestor)
CREATE POLICY "user_roles_select_all_auth" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Trigger: ao criar user em auth.users, popula profiles + user_roles a partir do raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_nome TEXT;
  v_iniciais TEXT;
  v_role public.app_role;
BEGIN
  v_slug := COALESCE(NEW.raw_user_meta_data->>'slug', split_part(NEW.email, '@', 1));
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email);
  v_iniciais := COALESCE(NEW.raw_user_meta_data->>'iniciais', UPPER(LEFT(v_nome, 2)));
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'analista'::public.app_role);

  INSERT INTO public.profiles (user_id, slug, nome, iniciais, email)
  VALUES (NEW.id, v_slug, v_nome, v_iniciais, NEW.email);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
