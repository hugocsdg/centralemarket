-- =====================================================================
-- CentraleMarket — favoritos: anuncios que cada estudiante guarda con el corazón
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se ejecuta UNA vez, después de schema.sql.
-- =====================================================================

-- Una fila = "este estudiante ha guardado este anuncio".
-- Si se borra el anuncio o la cuenta, el favorito desaparece solo.
create table if not exists public.favorites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id bigint not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

-- Tus favoritos son solo tuyos: nadie más (ni el vendedor) ve quién ha guardado qué.
drop policy if exists "Students can view their own favorites" on public.favorites;
create policy "Students can view their own favorites"
  on public.favorites for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Students can save favorites" on public.favorites;
create policy "Students can save favorites"
  on public.favorites for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Students can remove their favorites" on public.favorites;
create policy "Students can remove their favorites"
  on public.favorites for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.favorites from anon;
grant select, insert, delete on public.favorites to authenticated;
