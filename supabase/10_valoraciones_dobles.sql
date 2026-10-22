-- =====================================================================
-- CentraleMarket — valoraciones en los dos sentidos
--
-- Hasta ahora (07_mejoras_vinted.sql) solo el comprador valoraba al vendedor.
-- Ahora, cuando el vendedor marca un anuncio como "vendido a" alguien, se pueden valorar
-- los DOS: el comprador al vendedor y el vendedor al comprador (una vez cada uno).
--
--   - reviewee_id: a quién se valora.   - role: 'seller' (se le valora como vendedor) o 'buyer'.
--   - seller_ratings: ahora es la nota de cada persona con TODAS sus valoraciones (como en Vinted).
--   - user_ratings (nueva): la nota total, como vendedor y como comprador, y cuántas de cada estrella.
--   - Aviso nuevo 'rate_buyer': al vendedor, para que valore a quien le compró.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Después de 07 y 09. Se puede ejecutar dos veces sin problema.
-- (Puede salir el aviso de "destructive operations" por los "drop … if exists": es seguro.)
-- =====================================================================

alter table public.reviews
  add column if not exists reviewee_id uuid references public.profiles (id) on delete cascade,
  add column if not exists role text not null default 'seller' check (role in ('seller', 'buyer'));

-- Las valoraciones que ya existían son de compradores a vendedores.
update public.reviews set reviewee_id = seller_id where reviewee_id is null;
alter table public.reviews alter column reviewee_id set not null;

create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- Al valorar: la base de datos decide a quién y en qué papel (nadie puede valorar a quien quiera).
create or replace function public.prepare_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sold public.listings;
begin
  new.reviewer_id := auth.uid();
  select * into sold from public.listings l
  where l.id = new.listing_id and l.status = 'sold' and l.sold_to is not null;

  if sold.id is not null and sold.sold_to = new.reviewer_id then
    -- El comprador valora al vendedor
    new.seller_id := sold.seller_id;
    new.reviewee_id := sold.seller_id;
    new.role := 'seller';
  elsif sold.id is not null and sold.seller_id = new.reviewer_id then
    -- El vendedor valora al comprador
    new.seller_id := sold.seller_id;
    new.reviewee_id := sold.sold_to;
    new.role := 'buyer';
  else
    raise exception 'You can only review a sale you took part in';
  end if;
  return new;
end;
$$;

-- Nota de cada persona, con todas sus valoraciones (la usan la ficha del anuncio y el perfil).
create or replace view public.seller_ratings
with (security_invoker = true)
as
select reviewee_id as seller_id, round(avg(rating)::numeric, 1) as average, count(*)::int as total
from public.reviews
group by reviewee_id;

-- Más detalle para el perfil: como vendedor, como comprador y cuántas de cada estrella.
create or replace view public.user_ratings
with (security_invoker = true)
as
select
  reviewee_id as user_id,
  round(avg(rating)::numeric, 1) as average,
  count(*)::int as total,
  round(avg(rating) filter (where role = 'seller')::numeric, 1) as seller_average,
  (count(*) filter (where role = 'seller'))::int as seller_total,
  round(avg(rating) filter (where role = 'buyer')::numeric, 1) as buyer_average,
  (count(*) filter (where role = 'buyer'))::int as buyer_total,
  (count(*) filter (where rating = 5))::int as stars_5,
  (count(*) filter (where rating = 4))::int as stars_4,
  (count(*) filter (where rating = 3))::int as stars_3,
  (count(*) filter (where rating = 2))::int as stars_2,
  (count(*) filter (where rating = 1))::int as stars_1
from public.reviews
group by reviewee_id;

revoke all on public.user_ratings from anon;
grant select on public.user_ratings to authenticated;

-- Aviso a quien han valorado (antes iba siempre al vendedor).
create or replace function public.notify_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, listing_id, rating)
  values (new.reviewee_id, 'new_review', new.listing_id, new.rating);
  return new;
end;
$$;

-- Tipo de aviso nuevo: 'rate_buyer'.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in ('price_drop', 'rate_seller', 'rate_buyer', 'new_review', 'back_available', 'saved_search',
           'offer_reminder', 'event_tomorrow', 'likes', 'stale_listing')
);

-- Al marcar "vendido a": aviso al comprador (valorar al vendedor) y, nuevo, al vendedor (valorar al comprador).
-- (El resto es igual que en 09_push.sql.)
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

  if old.status = 'reserved' and new.status = 'available' then
    insert into public.notifications (user_id, kind, listing_id)
    select f.user_id, 'back_available', new.id
    from public.favorites f
    where f.listing_id = new.id and f.user_id <> new.seller_id;
  end if;

  if new.sold_to is not null and new.sold_to is distinct from old.sold_to then
    insert into public.notifications (user_id, kind, listing_id)
    values (new.sold_to, 'rate_seller', new.id), (new.seller_id, 'rate_buyer', new.id);
  end if;

  return new;
end;
$$;
