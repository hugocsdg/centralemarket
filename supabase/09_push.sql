-- =====================================================================
-- CentraleMarket — notificaciones en el móvil (push)
--
--   1. push_subscriptions: cada móvil/ordenador que activa las notificaciones
--   2. notification_prefs: qué avisos quiere cada estudiante (todos activados al principio)
--   3. saved_searches: búsquedas guardadas ("bici", "escritorio < 30 €")
--   4. Avisos nuevos en la campana: vuelve a estar disponible, búsqueda guardada,
--      oferta sin responder, tu evento es mañana, "a X personas les gusta", anuncio parado
--   5. Tareas programadas (pg_cron) para los avisos que dependen de la hora
--   6. pushed_at: para no enviar nunca el mismo aviso dos veces
--
-- Cómo llegan al móvil: cuando se guarda un mensaje (messages) o un aviso (notifications),
-- un "webhook" de Supabase llama a la función send-push (supabase/functions/send-push),
-- que mira los ajustes de la persona y envía la notificación a sus dispositivos.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Después de 07_mejoras_vinted.sql. Se puede ejecutar dos veces sin problema.
-- (Puede salir el aviso de "destructive operations" por los "drop … if exists": es seguro.)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Dispositivos con notificaciones activadas
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- La "dirección" del móvil que da el navegador (Apple, Google o Mozilla), y sus dos claves.
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  -- Idioma en el que mandar los avisos a este dispositivo.
  lang text not null default 'en' check (lang in ('en', 'fr', 'es', 'it', 'pt')),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Students manage their devices" on public.push_subscriptions;
create policy "Students manage their devices"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant insert (endpoint, p256dh, auth, lang) on public.push_subscriptions to authenticated;
grant update (p256dh, auth, lang) on public.push_subscriptions to authenticated;

-- Si el mismo móvil se activa con otra cuenta (p. ej. el de un amigo), la dirección pasa a la cuenta nueva.
create or replace function public.save_push_subscription(endpoint text, p256dh text, auth text, lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, lang)
  values ((select auth.uid()), save_push_subscription.endpoint, save_push_subscription.p256dh,
          save_push_subscription.auth, save_push_subscription.lang)
  on conflict on constraint push_subscriptions_endpoint_key do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang;
end;
$$;

revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Ajustes: qué avisos quiere cada uno (sin fila = todo activado)
-- ---------------------------------------------------------------------
create table if not exists public.notification_prefs (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  messages boolean not null default true,        -- mensajes y ofertas del chat
  price_drops boolean not null default true,     -- bajadas de precio de favoritos
  back_available boolean not null default true,  -- un favorito reservado vuelve a estar disponible
  offer_reminders boolean not null default true, -- oferta sin responder en 24 h
  saved_searches boolean not null default true,  -- algo nuevo que coincide con una búsqueda guardada
  reviews boolean not null default true,         -- valorar una compra / te han valorado
  event_reminders boolean not null default true, -- tu evento es mañana
  likes boolean not null default true,           -- resumen diario de "me gusta"
  listing_tips boolean not null default true,    -- anuncio parado desde hace 2 semanas
  quiet_hours boolean not null default true,     -- nada de 23:00 a 8:00 (salvo mensajes)
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

drop policy if exists "Students manage their notification settings" on public.notification_prefs;
create policy "Students manage their notification settings"
  on public.notification_prefs for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.notification_prefs from anon, authenticated;
grant select, insert, update on public.notification_prefs to authenticated;


-- ---------------------------------------------------------------------
-- 3. Búsquedas guardadas
-- ---------------------------------------------------------------------
create table if not exists public.saved_searches (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  query text not null default '' check (char_length(query) <= 80),
  category text check (char_length(category) <= 30),
  max_price numeric(8, 2) check (max_price >= 0 and max_price <= 10000),
  created_at timestamptz not null default now(),
  constraint saved_searches_not_empty check (query <> '' or category is not null or max_price is not null)
);

create index if not exists saved_searches_user_idx on public.saved_searches (user_id);

alter table public.saved_searches enable row level security;

drop policy if exists "Students manage their saved searches" on public.saved_searches;
create policy "Students manage their saved searches"
  on public.saved_searches for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.saved_searches from anon, authenticated;
grant select, delete on public.saved_searches to authenticated;
grant insert (query, category, max_price) on public.saved_searches to authenticated;

-- Como mucho 20 búsquedas guardadas por persona.
create or replace function public.limit_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  if (select count(*) from public.saved_searches s where s.user_id = new.user_id) >= 20 then
    raise exception 'You can save up to 20 searches';
  end if;
  return new;
end;
$$;

drop trigger if exists saved_searches_limit on public.saved_searches;
create trigger saved_searches_limit
  before insert on public.saved_searches
  for each row execute function public.limit_saved_searches();


-- ---------------------------------------------------------------------
-- 4. Avisos: tipos nuevos y columnas para el móvil
-- ---------------------------------------------------------------------
alter table public.notifications
  add column if not exists conversation_id bigint references public.conversations (id) on delete cascade,
  add column if not exists amount integer,          -- p. ej. cuántos "me gusta" hoy
  add column if not exists pushed_at timestamptz;   -- cuándo se envió al móvil (o se descartó)

alter table public.messages
  add column if not exists pushed_at timestamptz;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in ('price_drop', 'rate_seller', 'new_review', 'back_available', 'saved_search',
           'offer_reminder', 'event_tomorrow', 'likes', 'stale_listing')
);

-- Bajadas de precio, "vendido a" (de 07) y, nuevo: un favorito reservado vuelve a estar disponible.
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
    values (new.sold_to, 'rate_seller', new.id);
  end if;

  return new;
end;
$$;

-- Anuncio nuevo: aviso a quien tenga una búsqueda guardada que coincida.
-- Coincide si es de esa categoría (si la hay), cuesta como mucho el máximo (si lo hay)
-- y TODAS las palabras buscadas aparecen en el título o la descripción.
create or replace function public.notify_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'available' then
    return new;
  end if;
  insert into public.notifications (user_id, kind, listing_id)
  select distinct s.user_id, 'saved_search', new.id
  from public.saved_searches s
  where s.user_id <> new.seller_id
    and (s.category is null or s.category = new.category)
    and (s.max_price is null or new.price <= s.max_price)
    and not exists (
      select 1
      from unnest(regexp_split_to_array(lower(trim(s.query)), '\s+')) as word
      where word <> ''
        and position(word in lower(new.title || ' ' || new.description)) = 0
    );
  return new;
end;
$$;

drop trigger if exists listings_saved_searches on public.listings;
create trigger listings_saved_searches
  after insert on public.listings
  for each row execute function public.notify_saved_searches();


-- ---------------------------------------------------------------------
-- 5. Avisos que dependen de la hora (se ejecutan solos con pg_cron)
-- ---------------------------------------------------------------------

-- Cada hora: ofertas que llevan más de 24 h sin respuesta (un solo recordatorio por oferta).
create or replace function public.remind_pending_offers()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, listing_id, conversation_id, new_price)
  select
    case when m.sender_id = c.buyer_id then c.seller_id else c.buyer_id end,
    'offer_reminder', c.listing_id, c.id, m.offer_amount
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where m.offer_status = 'pending'
    and m.created_at < now() - interval '24 hours'
    and m.created_at > now() - interval '7 days'
    and not exists (
      select 1 from public.notifications n
      where n.kind = 'offer_reminder' and n.conversation_id = c.id and n.created_at > m.created_at
    );
$$;

-- Cada día a las 18:00 (París): tu evento es mañana (a quien compró la entrada).
create or replace function public.remind_tomorrows_events()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, listing_id)
  select l.sold_to, 'event_tomorrow', l.id
  from public.listings l
  where l.category = 'tickets'
    and l.sold_to is not null
    and (l.event_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date + 1
    and not exists (
      select 1 from public.notifications n
      where n.kind = 'event_tomorrow' and n.listing_id = l.id and n.user_id = l.sold_to
    );
$$;

-- Cada día a las 19:00: "A 3 personas les han gustado tus anuncios hoy" (uno al día como mucho).
create or replace function public.summarize_daily_likes()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, listing_id, amount)
  select l.seller_id, 'likes', (array_agg(l.id order by f.created_at desc))[1], count(*)::int
  from public.favorites f
  join public.listings l on l.id = f.listing_id
  where f.created_at > now() - interval '24 hours'
    and l.status <> 'sold'
    and f.user_id <> l.seller_id
  group by l.seller_id;
$$;

-- Cada día a las 11:00: anuncios disponibles desde hace 14 días sin cambios (un solo aviso por anuncio).
create or replace function public.suggest_stale_listings()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, listing_id)
  select l.seller_id, 'stale_listing', l.id
  from public.listings l
  where l.status = 'available'
    and l.created_at < now() - interval '14 days'
    and l.category not in ('tickets', 'food')
    and not exists (
      select 1 from public.notifications n
      where n.kind = 'stale_listing' and n.listing_id = l.id
    );
$$;

revoke all on function public.remind_pending_offers() from public, anon, authenticated;
revoke all on function public.remind_tomorrows_events() from public, anon, authenticated;
revoke all on function public.summarize_daily_likes() from public, anon, authenticated;
revoke all on function public.suggest_stale_listings() from public, anon, authenticated;

-- Programarlas (las horas de pg_cron van en UTC: 16:00 UTC = 18:00 en París en verano, 17:00 en invierno).
create extension if not exists pg_cron;

select cron.schedule('cm-offer-reminders', '5 * * * *', 'select public.remind_pending_offers()');
select cron.schedule('cm-event-reminders', '0 16 * * *', 'select public.remind_tomorrows_events()');
select cron.schedule('cm-daily-likes', '0 17 * * *', 'select public.summarize_daily_likes()');
select cron.schedule('cm-stale-listings', '0 9 * * *', 'select public.suggest_stale_listings()');


-- ---------------------------------------------------------------------
-- 6. Para la función send-push: "reservar" un mensaje o aviso para enviarlo una sola vez.
--    Devuelve la fila solo la primera vez (y si es reciente); después, nada.
-- ---------------------------------------------------------------------
create or replace function public.claim_push(kind text, row_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if kind = 'message' then
    update public.messages set pushed_at = now()
    where id = row_id and pushed_at is null and created_at > now() - interval '10 minutes'
    returning to_jsonb(messages.*) into result;
  elsif kind = 'notification' then
    update public.notifications set pushed_at = now()
    where id = row_id and pushed_at is null and created_at > now() - interval '10 minutes'
    returning to_jsonb(notifications.*) into result;
  end if;
  return result;
end;
$$;

-- Solo la usa la función del servidor (con la clave de servicio), nunca la app.
revoke all on function public.claim_push(text, bigint) from public, anon, authenticated;
grant execute on function public.claim_push(text, bigint) to service_role;
