-- =====================================================================
-- CentraleMarket — chat interno entre comprador y vendedor
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se ejecuta UNA vez, después de schema.sql.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Conversaciones: una por anuncio y comprador
-- ---------------------------------------------------------------------
create table public.conversations (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  buyer_id uuid not null,
  seller_id uuid not null,
  -- Resumen del último mensaje, para la lista de conversaciones.
  last_message text,
  last_sender_id uuid,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_buyer_fk foreign key (buyer_id) references public.profiles (id) on delete cascade,
  constraint conversations_seller_fk foreign key (seller_id) references public.profiles (id) on delete cascade,
  constraint conversations_one_per_buyer unique (listing_id, buyer_id),
  constraint conversations_not_with_yourself check (buyer_id <> seller_id)
);

create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_idx on public.conversations (seller_id, last_message_at desc);

alter table public.conversations enable row level security;

-- Al abrir una conversación, el comprador es quien la abre
-- y el vendedor se saca del anuncio (así nadie puede falsearlo).
create function public.prepare_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.buyer_id := auth.uid();
  select l.seller_id into new.seller_id from public.listings l where l.id = new.listing_id;
  if new.seller_id is null then
    raise exception 'Listing not found';
  end if;
  if new.seller_id = new.buyer_id then
    raise exception 'You cannot message yourself';
  end if;
  return new;
end;
$$;

create trigger conversations_prepare
  before insert on public.conversations
  for each row execute function public.prepare_conversation();

-- Solo los dos participantes ven la conversación.
create policy "Participants can view their conversations"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

create policy "Students can start a conversation as buyer"
  on public.conversations for insert
  to authenticated
  with check (buyer_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 2. Mensajes
-- ---------------------------------------------------------------------
create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  -- Cuándo lo leyó el destinatario (vacío = sin leer).
  read_at timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_unread_idx on public.messages (conversation_id) where read_at is null;

alter table public.messages enable row level security;

-- Función auxiliar: ¿participa el usuario actual en esta conversación?
create function public.is_participant(conversation bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conversation and (select auth.uid()) in (c.buyer_id, c.seller_id)
  );
$$;

create policy "Participants can read messages"
  on public.messages for select
  to authenticated
  using (public.is_participant(conversation_id));

-- Solo puedes escribir en tu nombre y en conversaciones tuyas.
create policy "Participants can send messages"
  on public.messages for insert
  to authenticated
  with check (sender_id = (select auth.uid()) and public.is_participant(conversation_id));

-- Solo el destinatario puede marcar un mensaje como leído.
create policy "Recipients can mark messages as read"
  on public.messages for update
  to authenticated
  using (public.is_participant(conversation_id) and sender_id <> (select auth.uid()))
  with check (public.is_participant(conversation_id) and sender_id <> (select auth.uid()));

-- Cada mensaje nuevo actualiza el resumen de su conversación.
create function public.update_conversation_summary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message = left(new.content, 120),
      last_sender_id = new.sender_id,
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_update_summary
  after insert on public.messages
  for each row execute function public.update_conversation_summary();


-- ---------------------------------------------------------------------
-- 3. Permisos de la API
-- ---------------------------------------------------------------------
revoke all on public.conversations, public.messages from anon;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
-- De un mensaje, lo único que se puede cambiar es "leído".
grant update (read_at) on public.messages to authenticated;


-- ---------------------------------------------------------------------
-- 4. Tiempo real: los mensajes nuevos llegan al instante sin recargar
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
