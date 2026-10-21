import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Check, HandCoins, ImageOff, Send, Star, X } from 'lucide-react'
import {
  fetchConversation,
  fetchMessages,
  markAsRead,
  respondToOffer,
  sendMessage,
  sendOffer,
  subscribeToMessages,
} from '../lib/chat'
import type { Conversation, Message } from '../lib/chat'
import { imageUrl } from '../lib/listings'
import { formatPrice } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import Avatar from '../components/Avatar'
import NotFoundPage from './NotFoundPage'
import { useT } from '../i18n/lang'
import { currentLocale } from '../i18n/core'

function ChatPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const t = useT()
  const conversation = useQuery(`conversation|${id}`, () => fetchConversation(Number(id)))

  if (conversation.loading) return <p className="py-20 text-center text-white/60">{t('Loading…')}</p>
  if (conversation.error) return <p className="py-20 text-center text-rosa">{t(conversation.error)}</p>
  if (!conversation.data) return <NotFoundPage />

  // "key" hace que al cambiar de conversación el chat empiece de cero.
  return (
    <ChatView
      key={conversation.data.id}
      conversation={conversation.data}
      userId={session!.user.id}
      onListingChanged={conversation.reload}
    />
  )
}

type ChatViewProps = {
  conversation: Conversation
  userId: string
  // Para volver a pedir el anuncio (p. ej. pasa a "reservado" al aceptar una oferta).
  onListingChanged: () => void
}

function ChatView({ conversation, userId, onListingChanged }: ChatViewProps) {
  const [params] = useSearchParams()
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  // Desde "Make an offer" en el anuncio se llega con ?offer=1 y el panel ya abierto.
  const [offerOpen, setOfferOpen] = useState(params.has('offer'))
  const t = useT()
  const bottomRef = useRef<HTMLDivElement>(null)
  // Guardado en una "ref" para no volver a conectar el tiempo real en cada pintado.
  const listingChangedRef = useRef(onListingChanged)
  useEffect(() => {
    listingChangedRef.current = onListingChanged
  })

  const iAmSeller = conversation.seller_id === userId
  const other = iAmSeller ? conversation.buyer : conversation.seller
  const listing = conversation.listing
  const cover = [...(listing?.images ?? [])].sort((a, b) => a.position - b.position)[0]
  const canOffer = listing !== null && listing.status !== 'sold'
  const boughtByMe = listing?.status === 'sold' && listing.sold_to === userId

  // Añade un mensaje a la lista sin duplicarlo (puede llegar por dos caminos).
  function upsert(message: Message) {
    setMessages((current) => {
      const list = current ?? []
      const index = list.findIndex((m) => m.id === message.id)
      if (index === -1) return [...list, message]
      const copy = [...list]
      copy[index] = message
      return copy
    })
  }

  // 1) Cargar el historial  2) escuchar mensajes nuevos en tiempo real  3) marcar como leído.
  useEffect(() => {
    fetchMessages(conversation.id).then(setMessages, (failure) => setError(failure.message))
    markAsRead(conversation.id, userId)
    return subscribeToMessages(
      `chat-${conversation.id}`,
      (message) => {
        upsert(message)
        if (message.sender_id !== userId && !message.read_at) markAsRead(conversation.id, userId)
        // Una oferta aceptada cambia el anuncio a "reservado": refrescar la cabecera.
        if (message.offer_status === 'accepted') listingChangedRef.current()
      },
      conversation.id,
    )
  }, [conversation.id, userId])

  // Bajar al último mensaje cada vez que llega uno.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  async function send(event?: FormEvent) {
    event?.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    setError('')
    try {
      upsert(await sendMessage(conversation.id, text))
      setText('')
    } catch {
      setError(t('Message not sent. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  async function makeOffer(amount: number) {
    setError('')
    const message = await sendOffer(conversation.id, amount)
    // La oferta anterior pendiente pasa a "sustituida": la marcamos ya en pantalla.
    setMessages((current) =>
      (current ?? []).map((m) => (m.offer_status === 'pending' ? { ...m, offer_status: 'replaced' as const } : m)),
    )
    upsert(message)
    setOfferOpen(false)
  }

  async function answer(offer: Message, accept: boolean) {
    setError('')
    try {
      await respondToOffer(offer.id, accept)
      upsert({ ...offer, offer_status: accept ? 'accepted' : 'declined' })
      if (accept) onListingChanged()
    } catch (failure) {
      setError(t(failure instanceof Error ? failure.message : 'Could not answer the offer. Please try again.'))
    }
  }

  // Enter envía; Shift + Enter hace salto de línea.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-14rem)] max-w-2xl flex-col md:h-[calc(100dvh-11rem)]">
      {/* Cabecera: con quién hablas y de qué anuncio */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <Link to="/messages" aria-label={t('Back to messages')} className="rounded-full p-2 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to={`/item/${conversation.listing_id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0">
            <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-white/5">
              {cover ? (
                <img src={imageUrl(cover.path)} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-white/20" />
              )}
            </div>
            <span className="absolute -right-1.5 -bottom-1.5 rounded-full border-2 border-noche">
              <Avatar name={other?.display_name} url={other?.avatar_url} className="h-6 w-6 text-[11px]" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{other?.display_name}</p>
            <p className="truncate text-xs text-white/60">
              {listing?.title} · {listing && formatPrice(listing.price, listing.price_unit)}
              {listing && listing.status !== 'available' && ` · ${t(listing.status === 'sold' ? 'Sold' : 'Reserved')}`}
            </p>
          </div>
        </Link>
      </div>

      {/* Has comprado esto: invitación a valorar al vendedor */}
      {boughtByMe && (
        <Link
          to={`/item/${conversation.listing_id}?rate=1`}
          className="mt-3 flex items-center gap-3 rounded-2xl border border-rosa/30 bg-rojo/10 px-4 py-3 text-sm transition hover:bg-rojo/20"
        >
          <Star className="h-5 w-5 shrink-0 fill-carmin text-carmin" />
          <span>
            <span className="font-semibold">{t('You bought this.')}</span>{' '}
            {t('How was it with {name}? Leave a rating.', { name: other?.display_name ?? '' })}
          </span>
        </Link>
      )}

      {/* Mensajes */}
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages === null && !error && <p className="text-center text-sm text-white/50">{t('Loading messages…')}</p>}
        {messages?.length === 0 && (
          <p className="mx-auto max-w-xs text-center text-sm text-white/50">
            {iAmSeller
              ? t('No messages yet.')
              : t("Say hi to {name}! Ask if it's still available, make an offer or propose a pickup time.", {
                  name: other?.display_name ?? '',
                })}
          </p>
        )}
        {messages?.map((message) => {
          const mine = message.sender_id === userId
          if (message.offer_amount !== null && message.offer_amount !== undefined) {
            return (
              <OfferBubble
                key={message.id}
                message={message}
                mine={mine}
                listPrice={listing?.price ?? null}
                onAnswer={(accept) => answer(message, accept)}
              />
            )
          }
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  mine ? 'rounded-br-md bg-gradient-to-br from-rojo to-carmin' : 'rounded-bl-md bg-white/10'
                }`}
              >
                <p className="break-words whitespace-pre-line">{systemText(message.content, t)}</p>
                <p className={`mt-0.5 text-right text-[11px] ${mine ? 'text-white/70' : 'text-white/60'}`}>
                  {new Date(message.created_at).toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' })}
                  {mine && (message.read_at ? ` · ${t('Seen')}` : '')}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">{t(error)}</p>}

      {offerOpen && canOffer && listing && (
        <OfferPanel listPrice={listing.price} onSend={makeOffer} onClose={() => setOfferOpen(false)} />
      )}

      {/* Escribir */}
      <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 pt-3">
        {canOffer && (
          <button
            type="button"
            onClick={() => setOfferOpen((open) => !open)}
            aria-label={t('Make an offer')}
            aria-expanded={offerOpen}
            title={t('Make an offer')}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
              offerOpen ? 'border-rosa bg-rojo/20 text-white' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <HandCoins className="h-5 w-5" />
          </button>
        )}
        <textarea
          rows={1}
          maxLength={2000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('Write a message…')}
          aria-label={t('Message')}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/50 focus:border-rosa"
        />
        <button
          disabled={!text.trim() || sending}
          aria-label={t('Send')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full btn-primary disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

// Los mensajes automáticos de las ofertas los escribe la base de datos en inglés: aquí se traducen.
function systemText(text: string, t: (text: string, vars?: Record<string, string>) => string) {
  const accepted = text.match(/^Offer accepted: (.+) €\. Let's agree on a time to meet!$/)
  if (accepted) return t("Offer accepted: {amount} €. Let's agree on a time to meet!", { amount: accepted[1] })
  const declined = text.match(/^Offer declined \((.+) €\)\.$/)
  if (declined) return t('Offer declined ({amount} €).', { amount: declined[1] })
  return text
}

const STATUS_LABEL = {
  pending: 'Waiting for an answer',
  accepted: 'Accepted',
  declined: 'Declined',
  replaced: 'Replaced by a new offer',
} as const

// Una oferta en el chat: tarjeta con el importe. Quien la recibe puede aceptarla o rechazarla.
function OfferBubble({
  message,
  mine,
  listPrice,
  onAnswer,
}: {
  message: Message
  mine: boolean
  listPrice: number | null
  onAnswer: (accept: boolean) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const t = useT()
  const status = message.offer_status ?? 'pending'
  const amount = Number(message.offer_amount)
  const discount = listPrice && listPrice > amount ? Math.round((1 - amount / listPrice) * 100) : 0

  async function run(accept: boolean) {
    setBusy(true)
    await onAnswer(accept)
    setBusy(false)
  }

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-64 max-w-[85%] overflow-hidden rounded-2xl border ${
          status === 'accepted'
            ? 'border-emerald-400/40 bg-emerald-500/10'
            : status === 'pending'
              ? 'border-rosa/40 bg-gradient-to-br from-burdeos/60 to-rojo/30'
              : 'border-white/10 bg-white/5 opacity-70'
        } ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}
      >
        <div className="px-4 pt-3 pb-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/70 uppercase">
            <HandCoins className="h-3.5 w-3.5" /> {t(mine ? 'Your offer' : 'Offer')}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={`font-display text-3xl font-bold ${status === 'declined' || status === 'replaced' ? 'line-through' : ''}`}>
              {formatPrice(amount)}
            </span>
            {listPrice !== null && listPrice !== amount && (
              <span className="text-sm text-white/60 line-through">{formatPrice(listPrice)}</span>
            )}
            {discount > 0 && <span className="text-xs font-semibold text-rosa">−{discount}%</span>}
          </p>
          <p className={`mt-1 text-xs ${status === 'accepted' ? 'font-semibold text-emerald-300' : 'text-white/60'}`}>
            {status === 'accepted' && '✓ '}
            {t(status === 'pending' && !mine ? 'Your turn to answer' : STATUS_LABEL[status])}
            {' · '}
            {new Date(message.created_at).toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {status === 'pending' && !mine && (
          <div className="grid grid-cols-2 border-t border-white/10">
            <button
              disabled={busy}
              onClick={() => run(false)}
              className="flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              <X className="h-4 w-4" /> {t('Decline')}
            </button>
            <button
              disabled={busy}
              onClick={() => run(true)}
              className="flex min-h-11 items-center justify-center gap-1.5 border-l border-white/10 bg-white/10 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {t('Accept')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Panel para escribir una oferta, con atajos de -10 %, -20 % y -30 % sobre el precio del anuncio.
function OfferPanel({
  listPrice,
  onSend,
  onClose,
}: {
  listPrice: number
  onSend: (amount: number) => Promise<void>
  onClose: () => void
}) {
  const [value, setValue] = useState('')
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const amount = Number(value.replace(',', '.'))
  const valid = value !== '' && !Number.isNaN(amount) && amount > 0 && amount <= 10000
  const suggestions = listPrice > 0 ? [10, 20, 30].map((off) => Math.max(1, Math.round(listPrice * (1 - off / 100)))) : []

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      await onSend(Math.round(amount * 100) / 100)
    } catch {
      setError(t('Offer not sent. Please try again.'))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-3 space-y-3 rounded-2xl border border-rosa/30 bg-grafito/80 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{t('Make an offer')}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Close offer')}
          className="-m-2 flex h-11 w-11 items-center justify-center rounded-full text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setValue(String(suggestion))}
              className={`min-h-11 rounded-full px-4 text-sm font-medium transition ${
                value === String(suggestion) ? 'btn-primary text-white' : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              {formatPrice(suggestion)} <span className="text-white/60">−{(index + 1) * 10}%</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">{t('Your offer in euros')}</span>
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(event) => setValue(event.target.value.replace(/[^\d.,]/g, ''))}
            placeholder={t('Listed at {price}', { price: formatPrice(listPrice) })}
            className="min-h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 pr-9 text-white outline-none placeholder:text-white/50 focus:border-rosa"
          />
          <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-white/60">€</span>
        </label>
        <button disabled={!valid || busy} className="btn-primary min-h-12 rounded-full px-5 text-sm font-semibold disabled:opacity-40">
          {t(busy ? 'Sending…' : 'Send offer')}
        </button>
      </div>
      {error && <p className="text-sm text-rosa">{error}</p>}
    </form>
  )
}

export default ChatPage
