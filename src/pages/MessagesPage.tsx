import { Link } from 'react-router'
import { ImageOff, MessageCircle } from 'lucide-react'
import { fetchConversations, fetchUnreadConversationIds } from '../lib/chat'
import { imageUrl } from '../lib/listings'
import { formatPosted } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'

// Bandeja de entrada: todas tus conversaciones, como compradora o como vendedora.
function MessagesPage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const conversations = useQuery('conversations', fetchConversations)
  const unread = useQuery('unread-ids', () => fetchUnreadConversationIds(userId))

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-bold">Messages</h1>

      {conversations.error && <p className="text-rosa">{conversations.error}</p>}
      {conversations.loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {conversations.data?.length === 0 && (
        <div className="rounded-3xl glass p-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-rosa" />
          <p className="mt-3 text-white/70">No conversations yet. Find something you like and message the seller.</p>
          <Link
            to="/explore"
            className="mt-5 inline-block rounded-full btn-primary px-5 py-2.5 text-sm font-semibold"
          >
            Explore the marketplace
          </Link>
        </div>
      )}

      <ul className="space-y-2">
        {conversations.data?.map((conversation) => {
          const iAmSeller = conversation.seller_id === userId
          const other = iAmSeller ? conversation.buyer : conversation.seller
          const cover = [...(conversation.listing?.images ?? [])].sort((a, b) => a.position - b.position)[0]
          const hasUnread = unread.data?.has(conversation.id)
          const lastIsMine = conversation.last_sender_id === userId

          return (
            <li key={conversation.id}>
              <Link
                to={`/messages/${conversation.id}`}
                className="flex items-center gap-3 rounded-2xl glass p-3 transition hover:bg-white/10"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {cover ? (
                    <img src={imageUrl(cover.path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-white/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${hasUnread ? 'font-bold' : 'font-medium'}`}>{other?.display_name}</p>
                    <span className="shrink-0 text-xs text-white/40">{formatPosted(conversation.last_message_at)}</span>
                  </div>
                  <p className="truncate text-xs text-white/50">
                    {iAmSeller ? 'Your listing' : 'Buying'} · {conversation.listing?.title}
                  </p>
                  <p className={`truncate text-sm ${hasUnread ? 'text-white' : 'text-white/60'}`}>
                    {lastIsMine && 'You: '}
                    {conversation.last_message}
                  </p>
                </div>
                {hasUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-carmin" aria-label="Unread" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default MessagesPage
