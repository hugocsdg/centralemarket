// =====================================================================
// CentraleMarket — función "send-push" (vive en Supabase → Edge Functions)
//
// La llaman dos webhooks de Supabase cada vez que se guarda:
//   - un mensaje del chat (tabla messages)       → aviso a la otra persona
//   - un aviso de la campana (tabla notifications) → aviso a su dueño
// Mira los ajustes de esa persona (notification_prefs) y lo envía a todos sus dispositivos
// (push_subscriptions), en su idioma. Si un dispositivo ya no existe, lo borra.
//
// Seguridad: no se fía de lo que le llega. Vuelve a leer la fila de la base de datos y la
// "reserva" con claim_push (solo funciona una vez y con filas de hace menos de 10 minutos),
// así nadie puede usarla para mandar avisos inventados ni repetidos.
//
// Necesita un secreto en Supabase → Edge Functions → Secrets: VAPID_PRIVATE_KEY.
// (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los pone Supabase solo.)
// Sin librerías: el cifrado de las notificaciones (estándar "Web Push") está hecho a mano abajo.
// =====================================================================

// La clave pública va también en la web (src/lib/push.ts). La privada, solo aquí, como secreto.
export const VAPID_PUBLIC_KEY =
  'BF3F57aukon69Yw_2d2yBLdPrTzZQ7BSxmBC6CZ1OTJ16iTBE4llyqHrBy9hZrsVtp1WDE7uhBmuguevXU_RnK8'
const CONTACT = 'https://centralemarket.vercel.app'

type Lang = 'en' | 'fr' | 'es' | 'it' | 'pt'
type Prefs = Record<string, boolean>
type Subscription = { id: number; endpoint: string; p256dh: string; auth: string; lang: Lang }
type Message = { id: number; conversation_id: number; sender_id: string; content: string; offer_amount: number | null }
type Notice = {
  id: number
  user_id: string
  kind: string
  listing_id: number | null
  conversation_id: number | null
  old_price: number | null
  new_price: number | null
  rating: number | null
  amount: number | null
}
export type Push = { title: string; body: string; url: string; tag: string }

// ---------------------------------------------------------------------
// Textos (en el idioma de cada dispositivo)
// ---------------------------------------------------------------------
const T: Record<Lang, Record<string, string>> = {
  en: {
    offer: 'Offer: {amount} €',
    offerAccepted: "Offer accepted: {amount} €. Let's agree on a time to meet!",
    offerDeclined: 'Offer declined ({amount} €).',
    price_drop: 'Price drop: {title}',
    price_drop_body: 'From {old} € to {new} €. Grab it before someone else does.',
    back_available: 'Available again: {title}',
    back_available_body: 'It was reserved and is back on sale.',
    saved_search: 'New match for your search',
    saved_search_body: '{title} · {price}',
    offer_reminder: 'An offer is waiting for you',
    offer_reminder_body: '{amount} € for {title}. Accept or decline it.',
    event_tomorrow: 'Your event is tomorrow',
    event_tomorrow_body: "{title}. Don't forget your ticket!",
    likes: '{n} people saved your listings today',
    likes_one: '1 person saved your listing today',
    likes_body: '{title} is getting attention.',
    stale_listing: 'Is "{title}" still available?',
    stale_listing_body: 'Lower the price or mark it as sold to keep your profile up to date.',
    rate_seller: 'How did it go?',
    rate_seller_body: 'You bought {title}. Rate the seller.',
    new_review: 'New review: {stars}',
    new_review_body: 'A buyer rated you for {title}.',
    free: 'Free',
    listing: 'a listing',
  },
  fr: {
    offer: 'Offre : {amount} €',
    offerAccepted: 'Offre acceptée : {amount} €. Fixons un moment pour se voir !',
    offerDeclined: 'Offre refusée ({amount} €).',
    price_drop: 'Prix en baisse : {title}',
    price_drop_body: 'De {old} € à {new} €. Fonce avant les autres.',
    back_available: 'De nouveau disponible : {title}',
    back_available_body: 'Il était réservé et il est de nouveau en vente.',
    saved_search: 'Nouveau résultat pour ta recherche',
    saved_search_body: '{title} · {price}',
    offer_reminder: 'Une offre t’attend',
    offer_reminder_body: '{amount} € pour {title}. Accepte-la ou refuse-la.',
    event_tomorrow: 'Ton événement, c’est demain',
    event_tomorrow_body: '{title}. N’oublie pas ta place !',
    likes: '{n} personnes ont enregistré tes annonces aujourd’hui',
    likes_one: '1 personne a enregistré ton annonce aujourd’hui',
    likes_body: '{title} attire l’attention.',
    stale_listing: '« {title} » est toujours disponible ?',
    stale_listing_body: 'Baisse le prix ou marque-le comme vendu pour garder ton profil à jour.',
    rate_seller: 'Comment ça s’est passé ?',
    rate_seller_body: 'Tu as acheté {title}. Note le vendeur.',
    new_review: 'Nouvel avis : {stars}',
    new_review_body: 'Un acheteur t’a noté pour {title}.',
    free: 'Gratuit',
    listing: 'une annonce',
  },
  es: {
    offer: 'Oferta: {amount} €',
    offerAccepted: 'Oferta aceptada: {amount} €. ¡Quedemos para el intercambio!',
    offerDeclined: 'Oferta rechazada ({amount} €).',
    price_drop: 'Ha bajado: {title}',
    price_drop_body: 'De {old} € a {new} €. Que no se te adelanten.',
    back_available: 'Vuelve a estar disponible: {title}',
    back_available_body: 'Estaba reservado y vuelve a estar a la venta.',
    saved_search: 'Novedad para tu búsqueda',
    saved_search_body: '{title} · {price}',
    offer_reminder: 'Tienes una oferta esperando',
    offer_reminder_body: '{amount} € por {title}. Acéptala o recházala.',
    event_tomorrow: 'Tu evento es mañana',
    event_tomorrow_body: '{title}. ¡No olvides tu entrada!',
    likes: 'A {n} personas les han gustado tus anuncios hoy',
    likes_one: 'A 1 persona le ha gustado tu anuncio hoy',
    likes_body: '{title} está llamando la atención.',
    stale_listing: '¿Sigue disponible «{title}»?',
    stale_listing_body: 'Baja el precio o márcalo como vendido para tener tu perfil al día.',
    rate_seller: '¿Qué tal fue?',
    rate_seller_body: 'Has comprado {title}. Valora al vendedor.',
    new_review: 'Nueva valoración: {stars}',
    new_review_body: 'Un comprador te ha valorado por {title}.',
    free: 'Gratis',
    listing: 'un anuncio',
  },
  it: {
    offer: 'Offerta: {amount} €',
    offerAccepted: 'Offerta accettata: {amount} €. Mettiamoci d’accordo per vederci!',
    offerDeclined: 'Offerta rifiutata ({amount} €).',
    price_drop: 'Prezzo ribassato: {title}',
    price_drop_body: 'Da {old} € a {new} €. Prendilo prima degli altri.',
    back_available: 'Di nuovo disponibile: {title}',
    back_available_body: 'Era prenotato ed è di nuovo in vendita.',
    saved_search: 'Novità per la tua ricerca',
    saved_search_body: '{title} · {price}',
    offer_reminder: 'Hai un’offerta in attesa',
    offer_reminder_body: '{amount} € per {title}. Accettala o rifiutala.',
    event_tomorrow: 'Il tuo evento è domani',
    event_tomorrow_body: '{title}. Non dimenticare il biglietto!',
    likes: '{n} persone hanno salvato i tuoi annunci oggi',
    likes_one: '1 persona ha salvato il tuo annuncio oggi',
    likes_body: '{title} sta attirando attenzione.',
    stale_listing: '«{title}» è ancora disponibile?',
    stale_listing_body: 'Abbassa il prezzo o segnalo come venduto per tenere il profilo aggiornato.',
    rate_seller: 'Com’è andata?',
    rate_seller_body: 'Hai comprato {title}. Valuta il venditore.',
    new_review: 'Nuova recensione: {stars}',
    new_review_body: 'Un acquirente ti ha valutato per {title}.',
    free: 'Gratis',
    listing: 'un annuncio',
  },
  pt: {
    offer: 'Oferta: {amount} €',
    offerAccepted: 'Oferta aceita: {amount} €. Vamos combinar um horário!',
    offerDeclined: 'Oferta recusada ({amount} €).',
    price_drop: 'Preço caiu: {title}',
    price_drop_body: 'De {old} € para {new} €. Corra antes que alguém pegue.',
    back_available: 'Disponível de novo: {title}',
    back_available_body: 'Estava reservado e voltou a estar à venda.',
    saved_search: 'Novidade para a sua busca',
    saved_search_body: '{title} · {price}',
    offer_reminder: 'Uma oferta está te esperando',
    offer_reminder_body: '{amount} € por {title}. Aceite ou recuse.',
    event_tomorrow: 'Seu evento é amanhã',
    event_tomorrow_body: '{title}. Não esqueça seu ingresso!',
    likes: '{n} pessoas salvaram seus anúncios hoje',
    likes_one: '1 pessoa salvou seu anúncio hoje',
    likes_body: '{title} está chamando atenção.',
    stale_listing: '“{title}” ainda está disponível?',
    stale_listing_body: 'Baixe o preço ou marque como vendido para manter seu perfil em dia.',
    rate_seller: 'Como foi?',
    rate_seller_body: 'Você comprou {title}. Avalie o vendedor.',
    new_review: 'Nova avaliação: {stars}',
    new_review_body: 'Um comprador te avaliou por {title}.',
    free: 'Grátis',
    listing: 'um anúncio',
  },
}

function say(lang: Lang, key: string, vars: Record<string, string | number> = {}) {
  const text = T[lang]?.[key] ?? T.en[key] ?? key
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

const euros = (value: number | string | null) => Number(value ?? 0).toLocaleString('fr-FR')
const short = (text: string, max = 140) => (text.length > max ? text.slice(0, max - 1) + '…' : text)

// Qué ajuste controla cada tipo de aviso.
const PREF_FOR: Record<string, string> = {
  message: 'messages',
  price_drop: 'price_drops',
  back_available: 'back_available',
  offer_reminder: 'offer_reminders',
  saved_search: 'saved_searches',
  rate_seller: 'reviews',
  new_review: 'reviews',
  event_tomorrow: 'event_reminders',
  likes: 'likes',
  stale_listing: 'listing_tips',
}

// Horas de silencio: de 23:00 a 8:00, hora de París.
export function isQuietTime(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(now))
  return hour >= 23 || hour < 8
}

// El texto de un mensaje del chat.
export function messagePush(lang: Lang, message: Message, senderName: string, listingTitle: string): Push {
  let body = message.content
  const accepted = body.match(/^Offer accepted: (.+) €\. Let's agree on a time to meet!$/)
  const declined = body.match(/^Offer declined \((.+) €\)\.$/)
  if (message.offer_amount !== null && message.offer_amount !== undefined) body = say(lang, 'offer', { amount: euros(message.offer_amount) })
  else if (accepted) body = say(lang, 'offerAccepted', { amount: accepted[1] })
  else if (declined) body = say(lang, 'offerDeclined', { amount: declined[1] })
  return {
    title: listingTitle ? `${senderName} · ${short(listingTitle, 40)}` : senderName,
    body: short(body),
    url: `/messages/${message.conversation_id}`,
    // Mismo "tag" para la misma conversación: los mensajes seguidos se juntan en una sola notificación.
    tag: `chat-${message.conversation_id}`,
  }
}

// El texto de un aviso de la campana.
export function noticePush(lang: Lang, notice: Notice, listing: { title: string; price: number } | null): Push {
  const title = listing?.title ? short(listing.title, 60) : say(lang, 'listing')
  const item = notice.listing_id ? `/item/${notice.listing_id}` : '/notifications'
  const vars = {
    title,
    old: euros(notice.old_price),
    new: euros(notice.new_price),
    amount: euros(notice.new_price),
    n: notice.amount ?? 0,
    stars: '★'.repeat(Math.max(0, Math.min(5, notice.rating ?? 0))),
    price: listing ? (Number(listing.price) === 0 ? say(lang, 'free') : `${euros(listing.price)} €`) : '',
  }
  const head = notice.kind === 'likes' && notice.amount === 1 ? 'likes_one' : notice.kind
  const url =
    notice.kind === 'offer_reminder' && notice.conversation_id
      ? `/messages/${notice.conversation_id}`
      : notice.kind === 'rate_seller'
        ? `${item}?rate=1`
        : notice.kind === 'new_review'
          ? '/user/me'
          : item
  return { title: say(lang, head, vars), body: say(lang, `${notice.kind}_body`, vars), url, tag: `${notice.kind}-${notice.id}` }
}

// ---------------------------------------------------------------------
// Web Push: firma VAPID (RFC 8292) y cifrado aes128gcm (RFC 8291), con WebCrypto
// ---------------------------------------------------------------------
const enc = new TextEncoder()

export function b64url(bytes: Uint8Array) {
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64url(text: string) {
  const base = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)
  return Uint8Array.from(atob(base), (char) => char.charCodeAt(0))
}

function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

async function hmac(key: Uint8Array, data: Uint8Array) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data))
}

// Firma "soy CentraleMarket" que piden Apple/Google/Mozilla para aceptar el aviso.
export async function vapidHeader(endpoint: string, publicKey: string, privateKey: string) {
  const pub = fromB64url(publicKey)
  const jwk = { kty: 'EC', crv: 'P-256', x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)), d: privateKey, ext: true }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const header = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64url(
    enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: CONTACT })),
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${claims}`)),
  )
  return `vapid t=${header}.${claims}.${b64url(signature)}, k=${publicKey}`
}

// Cifra el aviso para que solo ese móvil pueda leerlo.
export async function encryptPayload(payload: string, p256dh: string, authSecret: string, salt?: Uint8Array) {
  const uaPublic = fromB64url(p256dh)
  const auth = fromB64url(authSecret)
  const local = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey))
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256))

  const prkKey = await hmac(auth, shared)
  const ikm = await hmac(prkKey, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])))
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16))
  const prk = await hmac(saltBytes, ikm)
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16)
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const plain = concat(enc.encode(payload), new Uint8Array([2]))
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plain))

  const header = new Uint8Array(21)
  header.set(saltBytes, 0)
  new DataView(header.buffer).setUint32(16, 4096)
  header[20] = asPublic.length
  return concat(header, asPublic, cipher)
}

// Envía un aviso a un dispositivo. Devuelve el código HTTP (404/410 = el dispositivo ya no existe).
export async function sendWebPush(sub: Subscription, push: Push, privateKey: string, urgent: boolean) {
  const body = await encryptPayload(JSON.stringify(push), sub.p256dh, sub.auth)
  const response = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidHeader(sub.endpoint, VAPID_PUBLIC_KEY, privateKey),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(urgent ? 86400 : 6 * 3600),
      Urgency: urgent ? 'high' : 'normal',
    },
    body,
  })
  return response.status
}

// ---------------------------------------------------------------------
// La base de datos (API REST de Supabase, con la clave de servicio)
// ---------------------------------------------------------------------
function db(url: string, serviceKey: string) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  return {
    async rpc(name: string, args: Record<string, unknown>) {
      const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(args) })
      if (!response.ok) throw new Error(`${name}: ${response.status} ${await response.text()}`)
      return response.json()
    },
    async get<Row>(path: string): Promise<Row[]> {
      const response = await fetch(`${url}/rest/v1/${path}`, { headers })
      if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`)
      return response.json()
    },
    async remove(path: string) {
      await fetch(`${url}/rest/v1/${path}`, { method: 'DELETE', headers })
    },
  }
}

// ---------------------------------------------------------------------
// Lo que pasa cada vez que llama un webhook
// ---------------------------------------------------------------------
export async function handle(request: Request, env: (name: string) => string | undefined) {
  const url = env('SUPABASE_URL')
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
  const privateKey = env('VAPID_PRIVATE_KEY')
  if (!url || !serviceKey || !privateKey) return Response.json({ error: 'Missing configuration' }, { status: 500 })

  const event = await request.json().catch(() => null)
  const table = event?.table
  const id = Number(event?.record?.id)
  if (event?.type !== 'INSERT' || !['messages', 'notifications'].includes(table) || !id) {
    return Response.json({ skipped: 'not a new message or notification' })
  }

  const api = db(url, serviceKey)
  const row = await api.rpc('claim_push', { kind: table === 'messages' ? 'message' : 'notification', row_id: id })
  if (!row) return Response.json({ skipped: 'already sent or too old' })

  let userId: string
  let kind: string
  let build: (lang: Lang) => Push
  if (table === 'messages') {
    const message = row as Message
    const [conversation] = await api.get<{ buyer_id: string; seller_id: string; listing: { title: string } | null }>(
      `conversations?id=eq.${message.conversation_id}&select=buyer_id,seller_id,listing:listings(title)`,
    )
    if (!conversation) return Response.json({ skipped: 'no conversation' })
    userId = message.sender_id === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id
    const [sender] = await api.get<{ display_name: string }>(`profiles?id=eq.${message.sender_id}&select=display_name`)
    kind = 'message'
    build = (lang) => messagePush(lang, message, sender?.display_name ?? 'CentraleMarket', conversation.listing?.title ?? '')
  } else {
    const notice = row as Notice
    userId = notice.user_id
    kind = notice.kind
    const [listing] = notice.listing_id
      ? await api.get<{ title: string; price: number }>(`listings?id=eq.${notice.listing_id}&select=title,price`)
      : [null]
    build = (lang) => noticePush(lang, notice, listing ?? null)
  }

  const [prefs] = await api.get<Prefs>(`notification_prefs?user_id=eq.${userId}&select=*`)
  const prefName = PREF_FOR[kind]
  if (prefs && prefName && prefs[prefName] === false) return Response.json({ skipped: `${kind} turned off` })
  if (kind !== 'message' && (prefs?.quiet_hours ?? true) && isQuietTime()) return Response.json({ skipped: 'quiet hours' })

  const devices = await api.get<Subscription>(`push_subscriptions?user_id=eq.${userId}&select=id,endpoint,p256dh,auth,lang`)
  const results = await Promise.all(
    devices.map(async (device) => {
      try {
        const status = await sendWebPush(device, build(device.lang), privateKey, kind === 'message')
        if (status === 404 || status === 410) await api.remove(`push_subscriptions?id=eq.${device.id}`)
        return status
      } catch (error) {
        return String(error)
      }
    }),
  )
  return Response.json({ kind, sent: results })
}

// En Supabase (Deno) arranca el servidor; en las pruebas locales (Node) solo se usan las funciones.
declare const Deno: { serve: (handler: (request: Request) => Promise<Response>) => void; env: { get: (name: string) => string | undefined } } | undefined
if (typeof Deno !== 'undefined') {
  Deno.serve((request) => handle(request, (name) => Deno!.env.get(name)))
}
