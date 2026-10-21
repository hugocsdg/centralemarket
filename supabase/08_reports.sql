-- =====================================================================
-- CentraleMarket — botón "Report" (denunciar anuncios y usuarios)
--
-- - Cualquier estudiante puede denunciar un anuncio o a otro usuario (una vez cada uno).
-- - Las denuncias NO se pueden leer desde la app: solo las veis vosotros en
--   Supabase → Table Editor → reports (o la vista reports_overview, más cómoda).
-- - Si 3 estudiantes distintos denuncian el mismo anuncio, se oculta solo (lo sigue
--   viendo su vendedor). Para volver a mostrarlo: poned esas denuncias en status
--   'dismissed' (denuncia sin motivo). Para quitarlo del todo: borrad el anuncio.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Después de schema.sql … 07_mejoras_vinted.sql. Se puede ejecutar dos veces sin problema.
-- (Puede salir el aviso de "destructive operations" por los "drop … if exists": es seguro.)
-- =====================================================================

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Se denuncia O un anuncio O un usuario (uno de los dos).
  listing_id bigint references public.listings (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reason text not null check (
    reason in ('scam', 'prohibited', 'offensive', 'harassment', 'not_student', 'spam', 'other')
  ),
  details text not null default '' check (char_length(details) <= 500),
  -- open = pendiente; dismissed = sin motivo; resolved = ya se actuó
  status text not null default 'open' check (status in ('open', 'dismissed', 'resolved')),
  created_at timestamptz not null default now(),
  constraint reports_one_target check ((listing_id is null) <> (reported_user_id is null))
);

-- Una denuncia por persona y anuncio (o usuario): así nadie oculta un anuncio él solo.
create unique index if not exists reports_once_per_listing
  on public.reports (reporter_id, listing_id) where listing_id is not null;
create unique index if not exists reports_once_per_user
  on public.reports (reporter_id, reported_user_id) where reported_user_id is not null;
create index if not exists reports_open_listing_idx
  on public.reports (listing_id) where status = 'open';

alter table public.reports enable row level security;

-- Al denunciar: quién denuncia lo pone la base de datos, y no puedes denunciarte a ti mismo.
create or replace function public.prepare_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.reporter_id := auth.uid();
  new.status := 'open';
  new.created_at := now();
  if new.reported_user_id = new.reporter_id
     or exists (
       select 1 from public.listings l
       where l.id = new.listing_id and l.seller_id = new.reporter_id
     ) then
    raise exception 'You cannot report yourself';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_prepare on public.reports;
create trigger reports_prepare
  before insert on public.reports
  for each row execute function public.prepare_report();

-- Solo se puede ENVIAR una denuncia: ni leerlas, ni cambiarlas, ni borrarlas desde la app.
drop policy if exists "Students can send reports" on public.reports;
create policy "Students can send reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));

revoke all on public.reports from anon, authenticated;
grant insert (listing_id, reported_user_id, reason, details) on public.reports to authenticated;


-- ---------------------------------------------------------------------
-- Ocultar un anuncio con 3 denuncias pendientes de personas distintas
-- ---------------------------------------------------------------------
create or replace function public.listing_hidden(target bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct r.reporter_id) >= 3
  from public.reports r
  where r.listing_id = target and r.status = 'open';
$$;

revoke all on function public.listing_hidden(bigint) from public, anon;
grant execute on function public.listing_hidden(bigint) to authenticated;

-- Antes: todos los estudiantes veían todos los anuncios. Ahora: todos menos los ocultos
-- (el vendedor sigue viendo los suyos, para poder editarlos o borrarlos).
drop policy if exists "Students can view listings" on public.listings;
create policy "Students can view listings"
  on public.listings for select
  to authenticated
  using (seller_id = (select auth.uid()) or not public.listing_hidden(id));


-- ---------------------------------------------------------------------
-- Para revisar: Table Editor → reports_overview (solo la veis en Supabase)
-- ---------------------------------------------------------------------
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
  r.reported_user_id
from public.reports r
join public.profiles reporter on reporter.id = r.reporter_id
left join public.listings l on l.id = r.listing_id
left join public.profiles seller on seller.id = l.seller_id
left join public.profiles target on target.id = r.reported_user_id
order by r.created_at desc;

revoke all on public.reports_overview from anon, authenticated;
