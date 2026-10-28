-- =====================================================================
-- CentraleMarket — límites contra el spam y las estafas
--
-- Si alguien roba el email de un estudiante (como en la estafa por Outlook), podría entrar en
-- CentraleMarket con su cuenta. Estos límites hacen que NO pueda escribir a todo el campus de golpe.
-- Un estudiante normal nunca llega a ellos.
--
--   - Chats nuevos: máx. 10 por hora y 40 al día por persona.
--   - Mensajes: máx. 20 por minuto y 300 por hora por persona.
--   - Cuentas de menos de 24 h: no pueden enviar enlaces (truco típico de las estafas).
--   - Anuncios nuevos: máx. 20 al día por persona.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run. Después de 12_errores.sql.
-- Se puede ejecutar dos veces sin problema.
-- =====================================================================

-- ¿Este texto lleva un enlace? (http://, www., o algo.com/.fr/… con o sin barra)
create or replace function public.has_link(content text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select content ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|fr|net|org|io|co|me|ly|link|site|online|xyz|info|app|shop|top|click)\M)';
$$;

-- Chats nuevos
create or replace function public.limit_new_conversations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_hour int;
  last_day int;
begin
  select count(*) filter (where c.created_at > now() - interval '1 hour'), count(*)
  into last_hour, last_day
  from public.conversations c
  where c.buyer_id = auth.uid() and c.created_at > now() - interval '1 day';
  if last_hour >= 10 or last_day >= 40 then
    raise exception 'Too many new chats. Please try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_limit on public.conversations;
create trigger conversations_limit
  before insert on public.conversations
  for each row execute function public.limit_new_conversations();

-- Mensajes
create or replace function public.limit_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_minute int;
  last_hour int;
  account_age interval;
begin
  -- Los mensajes automáticos (aceptar/rechazar oferta) también cuentan, pero son pocos.
  select count(*) filter (where m.created_at > now() - interval '1 minute'), count(*)
  into last_minute, last_hour
  from public.messages m
  where m.sender_id = auth.uid() and m.created_at > now() - interval '1 hour';
  if last_minute >= 20 or last_hour >= 300 then
    raise exception 'You are sending messages too fast. Please wait a moment.';
  end if;

  select now() - p.created_at into account_age from public.profiles p where p.id = auth.uid();
  if account_age < interval '24 hours' and public.has_link(new.content) then
    raise exception 'New accounts can''t send links during their first 24 hours.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_limit on public.messages;
create trigger messages_limit
  before insert on public.messages
  for each row execute function public.limit_messages();

-- Anuncios nuevos
create or replace function public.limit_new_listings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.listings l
      where l.seller_id = auth.uid() and l.created_at > now() - interval '1 day') >= 20 then
    raise exception 'You can publish up to 20 listings per day.';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_limit on public.listings;
create trigger listings_limit
  before insert on public.listings
  for each row execute function public.limit_new_listings();

-- Índices para que contar sea instantáneo
create index if not exists messages_sender_recent_idx on public.messages (sender_id, created_at desc);
create index if not exists conversations_buyer_recent_idx on public.conversations (buyer_id, created_at desc);
