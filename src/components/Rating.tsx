import { useState } from 'react'
import type { FormEvent } from 'react'
import { Star } from 'lucide-react'
import { createReview } from '../lib/reviews'
import type { Rating, RatingDetail } from '../lib/reviews'
import { useT } from '../i18n/lang'

// Estrellas de solo lectura: ★★★★☆ (la media se redondea a media estrella).
export function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  const t = useT()
  return (
    <span className="flex items-center gap-0.5" aria-label={t('{n} out of 5 stars', { n: value })} role="img">
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
  const t = useT()
  if (!rating) return <span className="text-xs text-white/60">{t('No reviews yet')}</span>
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/80">
      <Star className="h-3.5 w-3.5 fill-carmin text-carmin" aria-hidden="true" />
      <span className="font-semibold">{rating.average.toFixed(1)}</span>
      <span className="text-white/60">
        ({t(rating.total === 1 ? '{n} review' : '{n} reviews', { n: rating.total })})
      </span>
    </span>
  )
}

const LABELS = ['', 'Bad', 'Not great', 'OK', 'Good', 'Excellent']

// Formulario para valorar al vendedor después de comprarle algo.
// Sirve para los dos sentidos: el comprador valora al vendedor y el vendedor al comprador.
export function RateSellerForm({
  listingId,
  sellerName,
  hint,
  onDone,
}: {
  listingId: number
  sellerName: string
  hint?: string
  onDone: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const shown = hover || rating
  const t = useT()

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
        <p className="font-semibold">{t('How was it with {name}?', { name: sellerName })}</p>
        <p className="text-xs text-white/60">{t(hint ?? 'Your rating helps other students buy with confidence.')}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex" role="radiogroup" aria-label={t('Rating')} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={t(star === 1 ? '{n} star' : '{n} stars', { n: star })}
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
        <span className="text-sm font-medium text-white/80">{shown ? t(LABELS[shown]) : ''}</span>
      </div>
      <textarea
        rows={2}
        maxLength={500}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t('Optional: on time, item as described, friendly…')}
        aria-label={t('Comment')}
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa"
      />
      {error && <p className="text-sm text-rosa">{t(error)}</p>}
      <button disabled={busy} className="btn-primary min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {t(busy ? 'Saving…' : 'Send rating')}
      </button>
    </form>
  )
}

// Resumen grande para el perfil: la nota, las estrellas, cuántas valoraciones de cada tipo
// y una barra por estrella (como en las tiendas de apps).
export function RatingBreakdown({ detail }: { detail: RatingDetail }) {
  const t = useT()
  return (
    <div className="glass flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
      <div className="flex shrink-0 flex-col items-center text-center sm:w-36">
        <p className="font-display text-5xl font-bold">{detail.average.toFixed(1)}</p>
        <Stars value={detail.average} className="mt-1 h-5 w-5" />
        <p className="mt-1.5 text-sm text-white/60">
          {t(detail.total === 1 ? '{n} review' : '{n} reviews', { n: detail.total })}
        </p>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => (
          <div key={star} className="flex items-center gap-2 text-xs text-white/70">
            <span className="w-3 text-right font-semibold">{star}</span>
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-carmin text-carmin" />
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-rojo to-carmin"
                style={{ width: `${detail.total ? (detail.stars[star] / detail.total) * 100 : 0}%` }}
              />
            </span>
            <span className="w-5 text-right">{detail.stars[star]}</span>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          {detail.seller && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              {t('As seller')} · ★ {detail.seller.average.toFixed(1)} ({detail.seller.total})
            </span>
          )}
          {detail.buyer && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              {t('As buyer')} · ★ {detail.buyer.average.toFixed(1)} ({detail.buyer.total})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
