import { supabase } from './supabase'

// Todo lo del chat interno: abrir conversaciones, leer y enviar mensajes.

export type Conversation = {
  id: number
  listing_id: number
  buyer_id: string
  seller_id: string
  last_message: string | null
  last_sender_id: string | null
  last_message_at: string
  listing: {
    id: number
    title: string
    price: number
    price_unit: string | null
    status: string
    // A quién se vendió (supabase/06_mejoras_vinted.sql); undefined si aún no se ejecutó.
    sold_to?: string | null
    images: { path: string; position: number }[]
  } | null
  buyer: { display_name: string; avatar_url: string | null } | null
  seller: { display_name: string; avatar_url: string | null } | null
}

export type Message = {
  id: number
  conversation_id: number
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
  // Ofertas de precio (supabase/06_mejoras_vinted.sql). Vacío = mensaje normal.
  offer_amount: number | null
  offer_status: 'pending' | 'accepted' | 'declined' | 'replaced' | null
}

const CONVERSATION_SELECT = `
  id, listing_id, buyer_id, seller_id, last_message, last_sender_id, last_message_at,
  listing:listings(*, images:listing_images(path, position)),
  buyer:profiles!conversations_buyer_fk(display_name, avatar_url),
  seller:profiles!conversations_seller_fk(display_name, avatar_url)
`

// Abre (o reutiliza) la conversación con el vendedor de un anuncio.
export async function startConversation(listingId: number, userId: string) {
  const existing = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', userId)
    .maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return existing.data.id as number

  // El comprador y el vendedor los rellena la base de datos (ver 02_chat.sql).
  const created = await supabase.from('conversations').insert({ listing_id: listingId }).select('id').single()
  if (created.error) throw created.error
  return created.data.id as number
}

// Mis conversaciones con al menos un mensaje, la más reciente primero.
export async function fetchConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .not('last_message', 'is', null)
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return data as unknown as Conversation[]
}

export async function fetchConversation(id: number) {
  const { data, error } = await supabase.from('conversations').select(CONVERSATION_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data as unknown as Conversation | null
}

export async function fetchMessages(conversationId: number) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw error
  return data as Message[]
}

export async function sendMessage(conversationId: number, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, content: content.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as Message
}

// Una oferta es un mensaje con importe. La base de datos la pone "pendiente"
// y marca como "sustituida" la oferta anterior que siguiera pendiente.
export async function sendOffer(conversationId: number, amount: number) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: `Offered ${amount.toLocaleString('fr-FR')} €`,
      offer_amount: amount,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Message
}

// Aceptar o rechazar una oferta que me han hecho. Si la acepto, el anuncio pasa a "reservado"
// y la base de datos envía un mensaje automático (llega por el tiempo real).
export async function respondToOffer(offerId: number, accept: boolean) {
  const { error } = await supabase.rpc('respond_to_offer', { offer_id: offerId, accept })
  if (error) throw error
}

// Marca como leídos los mensajes que me han enviado en esta conversación.
export async function markAsRead(conversationId: number, userId: string) {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null)
}

// Ids de las conversaciones donde tengo mensajes sin leer.
export async function fetchUnreadConversationIds(userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id')
    .neq('sender_id', userId)
    .is('read_at', null)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.conversation_id as number))
}

// Avisa cuando llega o cambia un mensaje en mis conversaciones (tiempo real).
// Supabase solo envía los mensajes que las reglas de seguridad me dejan ver.
export function subscribeToMessages(
  channelName: string,
  onChange: (message: Message, event: 'INSERT' | 'UPDATE') => void,
  conversationId?: number,
) {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        ...(conversationId ? { filter: `conversation_id=eq.${conversationId}` } : {}),
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          onChange(payload.new as Message, payload.eventType)
        }
      },
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
