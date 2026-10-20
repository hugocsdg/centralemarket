import { useState } from 'react'
import type { FormEvent } from 'react'
import { Star } from 'lucide-react'
import { createReview } from '../lib/reviews'
import type { Rating } from '../lib/reviews'

// Estrellas de solo lectura: ★★★★☆ (la media se redondea a media estrella).
export function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`${className} ${value >= star - 0.25 ? 'fill-carmin text-carmin' : 'text-white/25'}`}
        />
      ))}
    </span>
  )
}

// "★ 4.8 (12)" o "No reviews yet".
export function RatingSummary({ rating }: { rating: Rating | null | undefined }) {
  if (!rating) return <span className="text-xs text-white/60">No reviews yet</span>
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/80">
      <Star className="h-3.5 w-3.5 fill-carmin text-carmin" aria-hidden="true" />
      <span className="font-semibold">{rating.average.toFixed(1)}</span>
      <span className="text-white/60">
        ({rating.total} {rating.total === 1 ? 'review' : 'reviews'})
      </span>
    </span>
  )
}

const LABELS = ['', 'Bad', 'Not great', 'OK', 'Good', 'Excellent']

// Formulario para valorar al vendedor después de comprarle algo.
export function RateSellerForm({
  listingId,
  sellerName,
  onDone,
}: {
  listingId: number
  sellerName: string
  onDone: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const shown = hover || rating

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!rating) return setError('Tap a star to give a rating.')
    setBusy(true)
    setError('')
    try {
      await createReview(listingId, rating, comment)
      onDone()
    } catch {
      setError('Could not save your rating. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-rosa/30 bg-rojo/10 p-4">
      <div>
        <p className="font-semibold">How was it with {sellerName}?</p>
        <p className="text-xs text-white/60">Your rating helps other students buy with confidence.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              className="flex h-11 w-11 items-center justify-center"
            >
              <Star
                aria-hidden="true"
                className={`h-8 w-8 transition ${shown >= star ? 'scale-110 fill-carmin text-carmin' : 'text-white/30'}`}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-white/80">{LABELS[shown]}</span>
      </div>
      <textarea
        rows={2}
        maxLength={500}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional: on time, item as described, friendly…"
        aria-label="Comment"
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa"
      />
      {error && <p className="text-sm text-rosa">{error}</p>}
      <button disabled={busy} className="btn-primary min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {busy ? 'Saving…' : 'Send rating'}
      </button>
    </form>
  )
}
