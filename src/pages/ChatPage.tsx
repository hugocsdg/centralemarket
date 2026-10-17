import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ImageOff, Send } from 'lucide-react'
import { fetchConversation, fetchMessages, markAsRead, sendMessage, subscribeToMessages } from '../lib/chat'
import type { Conversation, Message } from '../lib/chat'
import { imageUrl } from '../lib/listings'
import { formatPrice } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import NotFoundPage from './NotFoundPage'

function ChatPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const conversation = useQuery(`conversation|${id}`, () => fetchConversation(Number(id)))

  if (conversation.loading) return <p className="py-20 text-center text-white/60">Loading…</p>
  if (conversation.error) return <p className="py-20 text-center text-rosa">{conversation.error}</p>
  if (!conversation.data) return <NotFoundPage />

  // "key" hace que al cambiar de conversación el chat empiece de cero.
  return <ChatView key={conversation.data.id} conversation={conversation.data} userId={session!.user.id} />
}

function ChatView({ conversation, userId }: { conversation: Conversation; userId: string }) {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const iAmSeller = conversation.seller_id === userId
  const other = iAmSeller ? conversation.buyer : conversation.seller
  const listing = conversation.listing
  const cover = [...(listing?.images ?? [])].sort((a, b) => a.position - b.position)[0]

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
      setError('Message not sent. Please try again.')
    } finally {
      setSending(false)
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
        <Link to="/messages" aria-label="Back to messages" className="rounded-full p-2 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to={`/item/${conversation.listing_id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
            {cover ? (
              <img src={imageUrl(cover.path)} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-white/20" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{other?.display_name}</p>
            <p className="truncate text-xs text-white/60">
              {listing?.title} · {listing && formatPrice(listing.price, listing.price_unit)}
              {listing && listing.status !== 'available' && ` · ${listing.status}`}
            </p>
          </div>
        </Link>
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages === null && !error && <p className="text-center text-sm text-white/50">Loading messages…</p>}
        {messages?.length === 0 && (
          <p className="mx-auto max-w-xs text-center text-sm text-white/50">
            {iAmSeller
              ? 'No messages yet.'
              : `Say hi to ${other?.display_name}! Ask if it's still available, propose a price or a pickup time.`}
          </p>
        )}
        {messages?.map((message) => {
          const mine = message.sender_id === userId
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  mine ? 'rounded-br-md bg-gradient-to-br from-rojo to-carmin' : 'rounded-bl-md bg-white/10'
                }`}
              >
                <p className="break-words whitespace-pre-line">{message.content}</p>
                <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-white/70' : 'text-white/40'}`}>
                  {new Date(message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {mine && (message.read_at ? ' · Seen' : '')}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">{error}</p>}

      {/* Escribir */}
      <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 pt-3">
        <textarea
          rows={1}
          maxLength={2000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/40 focus:border-rosa"
        />
        <button
          disabled={!text.trim() || sending}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full btn-primary disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

export default ChatPage
