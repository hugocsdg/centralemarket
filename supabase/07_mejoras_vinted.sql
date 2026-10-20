-- =====================================================================
-- CentraleMarket — mejoras "estilo Vinted":
--   1. Eventos y comida: campos nuevos en los anuncios
--   2. Bajadas de precio (para la etiqueta "Price drop")
--   3. Vendido a…: quién compró cada anuncio
--   4. Ofertas de precio dentro del chat
--   5. Valoraciones del vendedor
--   6. Avisos dentro de la app (bajadas de precio, valorar, nuevas valoraciones)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se ejecuta UNA vez, después de schema.sql, 02_chat.sql y 04_favorites.sql.
-- (Puede salir el aviso de "destructive operations" por los "drop … if exists": es seguro.)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Campos nuevos de los anuncios
-- ---------------------------------------------------------------------
alter table public.listings
  -- Entradas: cuándo es el evento. (El sitio va en "location".)
  add column if not exists event_at timestamptz,
  -- Entradas que quedan o raciones de comida disponibles. Vacío = 1 / no aplica.
  add column if not exists quantity smallint check (quantity between 1 and 500),
  -- Comida: cuándo se puede recoger, etiquetas y alérgenos.
  add column if not exists ready_at timestamptz,
  add column if not exists dietary text[] not null default '{}' check (
    dietary <@ array['vegetarian', 'vegan', 'halal', 'gluten-free', 'dairy-free', 'spicy']
  ),
  add column if not exists allergens text check (char_length(allergens) <= 200),
  -- El precio anterior si ha bajado (lo rellena la base de datos, no el vendedor).
  add column if not exists previous_price numeric(8, 2),
  -- A quién se vendió (solo alguien que haya hablado con el vendedor por el chat).
  add column if not exists sold_to uuid references public.profiles (id) on delete set null;

create index if not exists listings_event_at_idx on public.listings (event_at) where category = 'tickets';
create index if not exists listings_sold_to_idx on public.listings (sold_to);


-- ---------------------------------------------------------------------
-- 2 y 3. Al guardar un anuncio: calcular la bajada de precio y comprobar "vendido a"
-- ---------------------------------------------------------------------
create or replace function public.prepare_listing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.previous_price := null;
  else
    -- El precio anterior lo decide la base de datos: nadie puede inventarse una "rebaja".
    if new.price < old.price then
      new.previous_price := greatest(coalesce(old.previous_price, 0), old.price);
    elsif new.price > old.price then
      new.previous_price := null;
    else
      new.previous_price := old.previous_price;
    end if;
  end if;

  -- "Vendido a" solo tiene sentido si está vendido.
  if new.status <> 'sold' then
    new.sold_to := null;
  end if;

  -- Solo se puede marcar como comprador a alguien que te escribió por este anuncio.
  if new.sold_to is not null
     and (tg_op = 'INSERT' or new.sold_to is distinct from old.sold_to)
     and not exists (
       select 1 from public.conversations c
       where c.listing_id = new.id and c.buyer_id = new.sold_to
     ) then
    raise exception 'The buyer must have messaged you about this listing';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_prepare on public.listings;
create trigger listings_prepare
  before insert or update on public.listings
  for each row execute function public.prepare_listing();


-- ---------------------------------------------------------------------
-- 4. Ofertas de precio en el chat
--    Una oferta es un mensaje con importe. Quien la recibe la acepta o la rechaza.
-- ---------------------------------------------------------------------
alter table public.messages
  add column if not exists offer_amount numeric(8, 2) check (offer_amount > 0 and offer_amount <= 10000),
  add column if not exists offer_status text check (offer_status in ('pending', 'accepted', 'declined', 'replaced'));

-- Al enviar: una oferta siempre empieza "pendiente" y sustituye a la anterior pendiente.
create or replace function public.prepare_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.offer_amount is null then
    new.offer_status := null;
  else
    new.offer_status := 'pending';
    update public.messages
    set offer_status = 'replaced'
    where conversation_id = new.conversation_id and offer_status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_prepare on public.messages;
create trigger messages_prepare
  before insert on public.messages
  for each row execute function public.prepare_message();

-- Aceptar o rechazar una oferta. Solo puede hacerlo quien la RECIBIÓ.
-- Si se acepta: el anuncio pasa a "reservado" y se envía un mensaje automático.
create or replace function public.respond_to_offer(offer_id bigint, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer public.messages;
  convo public.conversations;
begin
  select * into offer from public.messages where id = offer_id for update;
  if offer.id is null or offer.offer_status is distinct from 'pending' then
    raise exception 'This offer is no longer open';
  end if;

  select * into convo from public.conversations where id = offer.conversation_id;
  if (select auth.uid()) not in (convo.buyer_id, convo.seller_id) or offer.sender_id = (select auth.uid()) then
    raise exception 'Only the person who received the offer can answer it';
  end if;

  update public.messages
  set offer_status = case when accept then 'accepted' else 'declined' end
  where id = offer_id;

  insert into public.messages (conversation_id, sender_id, content)
  values (
    offer.conversation_id,
    (select auth.uid()),
    case when accept
      then 'Offer accepted: ' || trim_scale(offer.offer_amount) || ' €. Let''s agree on a time to meet!'
      else 'Offer declined (' || trim_scale(offer.offer_amount) || ' €).'
    end
  );

  if accept then
    update public.listings set status = 'reserved' where id = convo.listing_id and status = 'available';
  end if;
end;
$$;

revoke all on function public.respond_to_offer(bigint, boolean) from public, anon;
grant execute on function public.respond_to_offer(bigint, boolean) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Valoraciones: el comprador valora al vendedor (1 a 5 estrellas)
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  constraint reviews_one_per_purchase unique (listing_id, reviewer_id)
);

create index if not exists reviews_seller_idx on public.reviews (seller_id, created_at desc);

alter table public.reviews enable row level security;

-- Solo puede valorar quien lo compró de verdad (el vendedor le marcó como comprador).
create or replace function public.prepare_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.reviewer_id := auth.uid();
  select l.seller_id into new.seller_id
  from public.listings l
  where l.id = new.listing_id and l.status = 'sold' and l.sold_to = new.reviewer_id;
  if new.seller_id is null then
    raise exception 'You can only review items you bought';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_prepare on public.reviews;
create trigger reviews_prepare
  before insert on public.reviews
  for each row execute function public.prepare_review();

drop policy if exists "Students can view reviews" on public.reviews;
create policy "Students can view reviews"
  on public.reviews for select
  to authenticated
  using (true);

drop policy if exists "Buyers can review their purchases" on public.reviews;
create policy "Buyers can review their purchases"
  on public.reviews for insert
  to authenticated
  with check (reviewer_id = (select auth.uid()));

drop policy if exists "Reviewers can edit their review" on public.reviews;
create policy "Reviewers can edit their review"
  on public.reviews for update
  to authenticated
  using (reviewer_id = (select auth.uid()))
  with check (reviewer_id = (select auth.uid()));

revoke all on public.reviews from anon;
grant select, insert on public.reviews to authenticated;
-- De una valoración solo se pueden cambiar las estrellas y el comentario.
grant update (rating, comment) on public.reviews to authenticated;

-- Nota media y número de valoraciones de cada vendedor.
create or replace view public.seller_ratings
with (security_invoker = true)
as
select seller_id, round(avg(rating)::numeric, 1) as average, count(*)::int as total
from public.reviews
group by seller_id;

revoke all on public.seller_ratings from anon;
grant select on public.seller_ratings to authenticated;


-- ---------------------------------------------------------------------
-- 6. Avisos dentro de la app
--    Los crea solo la base de datos; cada estudiante ve y marca como leídos los suyos.
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('price_drop', 'rate_seller', 'new_review')),
  listing_id bigint references public.listings (id) on delete cascade,
  old_price numeric(8, 2),
  new_price numeric(8, 2),
  rating smallint,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Students can view their notifications" on public.notifications;
create policy "Students can view their notifications"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Students can mark their notifications as read" on public.notifications;
create policy "Students can mark their notifications as read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.notifications from anon;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Cuando un anuncio baja de precio: aviso a quien lo tiene en favoritos.
-- Cuando se marca como vendido a alguien: aviso para que valore al vendedor.
create or replace function public.notify_listing_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.price < old.price and new.status <> 'sold' then
    insert into public.notifications (user_id, kind, listing_id, old_price, new_price)
    select f.user_id, 'price_drop', new.id, old.price, new.price
    from public.favorites f
    where f.listing_id = new.id and f.user_id <> new.seller_id;
  end if;

  if new.sold_to is not null and new.sold_to is distinct from old.sold_to then
    insert into public.notifications (user_id, kind, listing_id)
    values (new.sold_to, 'rate_seller', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists listings_notify on public.listings;
create trigger listings_notify
  after update on public.listings
  for each row execute function public.notify_listing_changes();

-- Cuando alguien te valora: aviso al vendedor.
create or replace function public.notify_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, listing_id, rating)
  values (new.seller_id, 'new_review', new.listing_id, new.rating);
  return new;
end;
$$;

drop trigger if exists reviews_notify on public.reviews;
create trigger reviews_notify
  after insert on public.reviews
  for each row execute function public.notify_new_review();

-- Los avisos llegan al instante (la campana se actualiza sin recargar).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
