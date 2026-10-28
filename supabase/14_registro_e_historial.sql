-- =====================================================================
-- CentraleMarket — registro de archivos SQL e historial de moderación
--
--   1. private.scripts_aplicados: qué archivos .sql se han ejecutado y cuándo.
--      Desde este archivo, cada .sql nuevo termina con una línea que se apunta solo:
--        select private.apuntar_script('15_lo_que_sea.sql');
--      Para mirarlo: select * from private.scripts_aplicados order by ejecutado_at;
--   2. admin_actions: queda apuntado cada vez que un administrador suspende o reactiva
--      una cuenta, cierra una denuncia, cambia o borra un anuncio ajeno, o cuando
--      se añade o quita un administrador. Nadie puede cambiarlo ni borrarlo desde la app;
--      solo lo ven los administradores. Lo apuntan triggers: no cambia nada de 11_admin.sql.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Después de 13_antiabuso.sql. Se puede ejecutar dos veces sin problema.
-- (Puede salir el aviso de "destructive operations" por los "drop … if exists": es seguro.)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Registro de archivos SQL (en el esquema "private": no se ve desde la web)
-- ---------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.scripts_aplicados (
  archivo text primary key,
  ejecutado_at timestamptz not null default now(),
  veces integer not null default 1,
  nota text
);

alter table private.scripts_aplicados enable row level security;

create or replace function private.apuntar_script(nombre text)
returns void
language sql
set search_path = ''
as $$
  insert into private.scripts_aplicados (archivo) values (nombre)
  on conflict (archivo) do update
    set ejecutado_at = now(), veces = private.scripts_aplicados.veces + 1, nota = null;
$$;

-- Los archivos de antes de este registro: se apuntan los que ya están en la base de datos
-- (no sabemos cuándo se ejecutaron, por eso la nota).
insert into private.scripts_aplicados (archivo, nota)
select archivo, 'ya estaba antes del registro (fecha desconocida)'
from (values
  ('schema.sql',                 to_regclass('public.listings') is not null),
  ('02_chat.sql',                to_regclass('public.messages') is not null),
  ('04_favorites.sql',           to_regclass('public.favorites') is not null),
  ('05_avatars.sql',             exists (select 1 from storage.buckets where id = 'avatars')),
  ('06_delete_account.sql',      to_regprocedure('public.delete_my_account()') is not null),
  ('07_mejoras_vinted.sql',      to_regclass('public.reviews') is not null),
  ('08_reports.sql',             to_regclass('public.reports') is not null),
  ('09_push.sql',                to_regclass('public.push_subscriptions') is not null),
  ('10_valoraciones_dobles.sql', exists (select 1 from information_schema.columns
                                         where table_schema = 'public' and table_name = 'reviews'
                                           and column_name = 'reviewee_id')),
  ('11_admin.sql',               to_regclass('public.admins') is not null),
  ('12_errores.sql',             to_regclass('public.client_errors') is not null),
  ('13_antiabuso.sql',           to_regprocedure('public.has_link(text)') is not null)
) as t(archivo, ok)
where ok
on conflict (archivo) do nothing;


-- ---------------------------------------------------------------------
-- 2. Historial de moderación
-- ---------------------------------------------------------------------
create table if not exists public.admin_actions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- Quién lo hizo (vacío = desde el SQL Editor de Supabase).
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in (
    'ban', 'unban', 'report_resolved', 'report_dismissed',
    'listing_edited', 'listing_deleted', 'admin_added', 'admin_removed'
  )),
  -- A quién afecta. El nombre y el título se copian por si luego se borra la cuenta o el anuncio.
  target_user_id uuid references public.profiles (id) on delete set null,
  target_name text,
  listing_id bigint,
  listing_title text,
  report_id bigint,
  detail text
);

create index if not exists admin_actions_created_idx on public.admin_actions (created_at desc);
create index if not exists admin_actions_target_idx on public.admin_actions (target_user_id);

alter table public.admin_actions enable row level security;

-- Solo los administradores pueden leerlo. Nadie puede escribir, cambiar ni borrar desde la app:
-- las filas las ponen los triggers de abajo.
drop policy if exists "Admins can view admin actions" on public.admin_actions;
create policy "Admins can view admin actions"
  on public.admin_actions for select
  to authenticated
  using (public.is_admin());

revoke all on public.admin_actions from anon, authenticated;
grant select on public.admin_actions to authenticated;

-- Apuntar una acción (solo la usan los triggers; está en "private", no se puede llamar desde la web).
create or replace function private.log_admin_action(
  action text,
  target uuid default null,
  listing bigint default null,
  title text default null,
  report bigint default null,
  detail text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_actions
    (admin_id, action, target_user_id, target_name, listing_id, listing_title, report_id, detail)
  values (
    (select auth.uid()), action, target,
    (select p.display_name from public.profiles p where p.id = target),
    listing, title, report, left(detail, 300)
  );
$$;

revoke all on function private.log_admin_action(text, uuid, bigint, text, bigint, text) from public, anon, authenticated;


-- Suspender / reactivar (admin_set_ban, o a mano desde el SQL Editor).
create or replace function private.log_ban()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.banned_at is distinct from old.banned_at then
    perform private.log_admin_action(
      case when new.banned_at is null then 'unban' else 'ban' end,
      target => new.id,
      detail => new.ban_reason
    );
  end if;
  return null;
end;
$$;

drop trigger if exists profiles_log_ban on public.profiles;
create trigger profiles_log_ban
  after update of banned_at on public.profiles
  for each row execute function private.log_ban();


-- Cerrar denuncias ('resolved' = se actuó, 'dismissed' = sin motivo).
create or replace function private.log_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.listings;
begin
  if new.status is distinct from old.status and new.status in ('resolved', 'dismissed') then
    select * into l from public.listings where id = new.listing_id;
    perform private.log_admin_action(
      'report_' || new.status,
      target => coalesce(l.seller_id, new.reported_user_id),
      listing => new.listing_id,
      title => l.title,
      report => new.id,
      detail => new.reason
    );
  end if;
  return null;
end;
$$;

drop trigger if exists reports_log_close on public.reports;
create trigger reports_log_close
  after update of status on public.reports
  for each row execute function private.log_report();


-- Anuncios de OTRA persona que un administrador cambia o borra
-- (lo que hace cada uno con sus propios anuncios no se apunta).
create or replace function private.log_listing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cambios text;
begin
  if (select auth.uid()) is null
     or old.seller_id = (select auth.uid())
     or not public.is_admin() then
    return null;
  end if;

  if tg_op = 'DELETE' then
    perform private.log_admin_action(
      'listing_deleted', target => old.seller_id, listing => old.id, title => old.title
    );
  else
    cambios := concat_ws(', ',
      case when new.status is distinct from old.status then 'status: ' || old.status || ' → ' || new.status end,
      case when new.title is distinct from old.title then 'title: ' || old.title || ' → ' || new.title end,
      case when new.price is distinct from old.price then 'price: ' || old.price || ' → ' || new.price end,
      case when new.description is distinct from old.description then 'description' end
    );
    perform private.log_admin_action(
      'listing_edited', target => old.seller_id, listing => old.id, title => old.title,
      detail => nullif(cambios, '')
    );
  end if;
  return null;
end;
$$;

drop trigger if exists listings_log_admin on public.listings;
create trigger listings_log_admin
  after update or delete on public.listings
  for each row execute function private.log_listing();


-- Añadir o quitar administradores.
create or replace function private.log_admins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.log_admin_action('admin_added', target => new.user_id);
  else
    perform private.log_admin_action('admin_removed', target => old.user_id);
  end if;
  return null;
end;
$$;

drop trigger if exists admins_log on public.admins;
create trigger admins_log
  after insert or delete on public.admins
  for each row execute function private.log_admins();


-- ---------------------------------------------------------------------
-- Para revisar: Table Editor → admin_actions_overview (o la futura pestaña en /admin)
-- ---------------------------------------------------------------------
create or replace view public.admin_actions_overview
with (security_invoker = true)
as
select
  a.id,
  a.created_at,
  coalesce(admin.display_name, 'SQL Editor') as done_by,
  a.action,
  a.target_name as affects,
  a.listing_title,
  a.detail,
  a.admin_id,
  a.target_user_id,
  a.listing_id,
  a.report_id
from public.admin_actions a
left join public.profiles admin on admin.id = a.admin_id
order by a.created_at desc;

revoke all on public.admin_actions_overview from anon, authenticated;
grant select on public.admin_actions_overview to authenticated;


-- ---------------------------------------------------------------------
-- Apuntar este archivo y enseñar el registro
-- ---------------------------------------------------------------------
select private.apuntar_script('14_registro_e_historial.sql');

select archivo, ejecutado_at, veces, nota from private.scripts_aplicados order by archivo;
