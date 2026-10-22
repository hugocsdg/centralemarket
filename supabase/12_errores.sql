-- =====================================================================
-- CentraleMarket — registro de errores de la app
--
-- Si la app falla en el móvil u ordenador de alguien, se guarda aquí qué falló y en qué pantalla
-- (sin datos personales: ni mensajes, ni contraseñas, ni contenido de anuncios).
-- Los administradores lo ven en la app: Admin → Errors.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run. Después de 11_admin.sql.
-- Se puede ejecutar dos veces sin problema.
-- =====================================================================

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references public.profiles (id) on delete set null,
  message text not null check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  page text check (char_length(page) <= 300),
  user_agent text check (char_length(user_agent) <= 300),
  app_version text check (char_length(app_version) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists client_errors_created_idx on public.client_errors (created_at desc);

alter table public.client_errors enable row level security;

-- Cualquiera puede ENVIAR un error (también sin sesión, p. ej. en el login), pero no leerlos.
drop policy if exists "Anyone can report an error" on public.client_errors;
create policy "Anyone can report an error"
  on public.client_errors for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- Solo los administradores los leen y los borran.
drop policy if exists "Admins can read errors" on public.client_errors;
create policy "Admins can read errors"
  on public.client_errors for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete errors" on public.client_errors;
create policy "Admins can delete errors"
  on public.client_errors for delete
  to authenticated
  using (public.is_admin());

revoke all on public.client_errors from anon, authenticated;
grant insert (message, stack, page, user_agent, app_version) on public.client_errors to anon, authenticated;
grant select, delete on public.client_errors to authenticated;

-- Para no llenar la base de datos: como mucho 300 errores por hora en total.
create or replace function public.limit_client_errors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  if (select count(*) from public.client_errors where created_at > now() - interval '1 hour') >= 300 then
    return null; -- se descarta en silencio
  end if;
  return new;
end;
$$;

drop trigger if exists client_errors_limit on public.client_errors;
create trigger client_errors_limit
  before insert on public.client_errors
  for each row execute function public.limit_client_errors();

-- Los errores de hace más de 60 días se borran solos cada noche.
select cron.schedule('cm-clean-errors', '30 3 * * *', $$delete from public.client_errors where created_at < now() - interval '60 days'$$);
