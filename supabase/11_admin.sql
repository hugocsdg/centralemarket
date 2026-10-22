-- =====================================================================
-- CentraleMarket — panel de administración, cuentas suspendidas y bloqueos
--
--   1. admins: quién puede usar /admin (los dos fundadores). is_admin() lo comprueba.
--   2. Cuentas suspendidas (profiles.banned_at): no pueden publicar, escribir ni valorar,
--      y sus anuncios dejan de verse. Lo deciden los administradores (admin_set_ban).
--   3. Bloqueos entre estudiantes (blocks): si bloqueas a alguien, dejas de ver sus anuncios
--      y no puede escribirte ni empezar un chat contigo.
--   4. Poderes de administrador: ver y cerrar denuncias, ocultar o borrar cualquier anuncio
--      (y sus fotos), buscar usuarios y ver las estadísticas.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Después de 08_reports.sql. Se puede ejecutar dos veces sin problema.
-- IMPORTANTE: al final hay que poner los emails de los administradores (ver el apartado 5).
-- (Puede salir el aviso de "destructive operations" por los "drop … if exists": es seguro.)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Administradores
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada uno solo puede ver si ÉL es administrador (para enseñar o no el botón en la app).
drop policy if exists "Admins can see themselves" on public.admins;
create policy "Admins can see themselves"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 2. Cuentas suspendidas
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text check (char_length(ban_reason) <= 300);

-- Nadie puede quitarse (ni ponerse) la suspensión editando su perfil: solo admin_set_ban.
create or replace function public.protect_ban_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('cm.admin_action', true), '') <> 'on' then
    new.banned_at := old.banned_at;
    new.ban_reason := old.ban_reason;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_ban on public.profiles;
create trigger profiles_protect_ban
  before update on public.profiles
  for each row execute function public.protect_ban_fields();

create or replace function public.is_banned(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = target and p.banned_at is not null);
$$;

revoke all on function public.is_banned(uuid) from public, anon;
grant execute on function public.is_banned(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Bloqueos entre estudiantes
-- ---------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_yourself check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "Students manage who they block" on public.blocks;
create policy "Students manage who they block"
  on public.blocks for all
  to authenticated
  using (blocker_id = (select auth.uid()))
  with check (blocker_id = (select auth.uid()));

revoke all on public.blocks from anon, authenticated;
grant select, delete on public.blocks to authenticated;
grant insert (blocked_id) on public.blocks to authenticated;

-- ¿"target" me ha bloqueado a mí? (para no dejarle escribir)
create or replace function public.blocked_me(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b where b.blocker_id = target and b.blocked_id = (select auth.uid())
  );
$$;

revoke all on function public.blocked_me(uuid) from public, anon;
grant execute on function public.blocked_me(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- Reglas "restrictivas": se SUMAN a las que ya hay (todas tienen que cumplirse)
-- ---------------------------------------------------------------------

-- Anuncios: no se ven los de cuentas suspendidas ni los de gente que he bloqueado
-- (los míos y, para los administradores, todos, sí).
drop policy if exists "Hide banned and blocked sellers" on public.listings;
create policy "Hide banned and blocked sellers"
  on public.listings as restrictive for select
  to authenticated
  using (
    seller_id = (select auth.uid())
    or public.is_admin()
    or (
      not public.is_banned(seller_id)
      and not exists (
        select 1 from public.blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = seller_id
      )
    )
  );

-- Una cuenta suspendida no puede publicar ni editar anuncios.
drop policy if exists "Banned students cannot publish" on public.listings;
create policy "Banned students cannot publish"
  on public.listings as restrictive for insert
  to authenticated
  with check (not public.is_banned((select auth.uid())));

drop policy if exists "Banned students cannot edit" on public.listings;
create policy "Banned students cannot edit"
  on public.listings as restrictive for update
  to authenticated
  using (public.is_admin() or not public.is_banned((select auth.uid())));

-- Chats: ni suspendidos ni bloqueados pueden empezar un chat o escribir.
drop policy if exists "No chats when banned or blocked" on public.conversations;
create policy "No chats when banned or blocked"
  on public.conversations as restrictive for insert
  to authenticated
  with check (not public.is_banned((select auth.uid())) and not public.blocked_me(seller_id));

drop policy if exists "No messages when banned or blocked" on public.messages;
create policy "No messages when banned or blocked"
  on public.messages as restrictive for insert
  to authenticated
  with check (
    not public.is_banned((select auth.uid()))
    and not exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.blocked_me(case when c.buyer_id = (select auth.uid()) then c.seller_id else c.buyer_id end)
    )
  );

-- Valoraciones: una cuenta suspendida no puede valorar.
drop policy if exists "Banned students cannot review" on public.reviews;
create policy "Banned students cannot review"
  on public.reviews as restrictive for insert
  to authenticated
  with check (not public.is_banned((select auth.uid())));


-- ---------------------------------------------------------------------
-- 4. Poderes de los administradores
-- ---------------------------------------------------------------------

-- Ver todos los anuncios (también los ocultos por denuncias) y poder cambiarlos o borrarlos.
drop policy if exists "Admins can view all listings" on public.listings;
create policy "Admins can view all listings"
  on public.listings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update listings" on public.listings;
create policy "Admins can update listings"
  on public.listings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete listings" on public.listings;
create policy "Admins can delete listings"
  on public.listings for delete
  to authenticated
  using (public.is_admin());

-- Borrar las fotos de un anuncio que se elimina.
drop policy if exists "Admins can delete listing photos" on storage.objects;
create policy "Admins can delete listing photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and public.is_admin());

-- Denuncias: verlas todas y marcarlas como resueltas o sin motivo.
drop policy if exists "Admins can view reports" on public.reports;
create policy "Admins can view reports"
  on public.reports for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- La vista de denuncias (de 08) con una columna más al final: a quién se denuncia (su id).
create or replace view public.reports_overview
with (security_invoker = true)
as
select
  r.id,
  r.created_at,
  r.status,
  r.reason,
  r.details,
  reporter.display_name as reported_by,
  case when r.listing_id is not null then 'listing' else 'user' end as type,
  l.title as listing_title,
  coalesce(seller.display_name, target.display_name) as against,
  r.listing_id,
  r.reported_user_id,
  coalesce(l.seller_id, r.reported_user_id) as against_id
from public.reports r
join public.profiles reporter on reporter.id = r.reporter_id
left join public.listings l on l.id = r.listing_id
left join public.profiles seller on seller.id = l.seller_id
left join public.profiles target on target.id = r.reported_user_id
order by r.created_at desc;

grant select on public.reports to authenticated;
grant update (status) on public.reports to authenticated;
grant select on public.reports_overview to authenticated;

-- Suspender o reactivar una cuenta.
create or replace function public.admin_set_ban(target uuid, banned boolean, reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this';
  end if;
  if target = (select auth.uid()) then
    raise exception 'You cannot ban yourself';
  end if;
  perform set_config('cm.admin_action', 'on', true);
  update public.profiles
  set banned_at = case when banned then now() else null end,
      ban_reason = case when banned then left(reason, 300) else null end
  where id = target;
  perform set_config('cm.admin_action', 'off', true);
end;
$$;

revoke all on function public.admin_set_ban(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_ban(uuid, boolean, text) to authenticated;

-- Buscar usuarios (por nombre o email). Solo administradores; el email solo lo ven ellos.
create or replace function public.admin_search_users(search text default '')
returns table (
  id uuid,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz,
  banned_at timestamptz,
  ban_reason text,
  listings integer,
  reports integer,
  rating numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this';
  end if;
  return query
  select p.id, p.display_name, u.email::text, p.avatar_url, p.created_at, p.banned_at, p.ban_reason,
    (select count(*)::int from public.listings l where l.seller_id = p.id),
    (select count(*)::int from public.reports r
       left join public.listings l on l.id = r.listing_id
       where (r.reported_user_id = p.id or l.seller_id = p.id) and r.status = 'open'),
    (select round(avg(rv.rating)::numeric, 1) from public.reviews rv where rv.reviewee_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where search = ''
     or p.display_name ilike '%' || search || '%'
     or u.email ilike '%' || search || '%'
  order by p.created_at desc
  limit 50;
end;
$$;

revoke all on function public.admin_search_users(text) from public, anon;
grant execute on function public.admin_search_users(text) to authenticated;

-- Números para el resumen (y para enseñar a la escuela).
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this';
  end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_week', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'listings', (select count(*) from public.listings),
    'listings_available', (select count(*) from public.listings where status = 'available'),
    'listings_week', (select count(*) from public.listings where created_at > now() - interval '7 days'),
    'sold', (select count(*) from public.listings where status = 'sold'),
    'conversations', (select count(*) from public.conversations),
    'messages_week', (select count(*) from public.messages where created_at > now() - interval '7 days'),
    'reviews', (select count(*) from public.reviews),
    'rating', (select round(avg(rating)::numeric, 1) from public.reviews),
    'open_reports', (select count(*) from public.reports where status = 'open'),
    'banned', (select count(*) from public.profiles where banned_at is not null),
    'push_devices', (select count(*) from public.push_subscriptions)
  );
end;
$$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;


-- ---------------------------------------------------------------------
-- 5. Quién es administrador: pon aquí los emails @student-cs.fr (con su cuenta ya creada)
-- ---------------------------------------------------------------------
insert into public.admins (user_id)
select u.id from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) in ('ADMIN_EMAIL_1', 'ADMIN_EMAIL_2')
on conflict do nothing;

-- Comprobación: debería salir una fila por administrador.
select p.display_name as administrador from public.admins a join public.profiles p on p.id = a.user_id;
