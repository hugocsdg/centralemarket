import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Heart } from 'lucide-react'
import { useFavorites } from '../lib/favorites'

type FavoriteButtonProps = {
  listingId: number
  title: string
  // "card": círculo pequeño sobre la foto. "page": botón con texto en la página del anuncio.
  variant?: 'card' | 'page'
}

// Corazón para guardar un anuncio. Sin sesión, lleva a iniciar sesión.
function FavoriteButton({ listingId, title, variant = 'card' }: FavoriteButtonProps) {
  const { ids, signedIn, toggle } = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()
  const [failed, setFailed] = useState(false)
  const saved = ids.has(listingId)

  async function onClick(event: MouseEvent) {
    // En las tarjetas el corazón está encima del enlace al anuncio: que no lo abra.
    event.preventDefault()
    event.stopPropagation()
    if (!signedIn) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    setFailed(false)
    const ok = await toggle(listingId)
    if (!ok) {
      setFailed(true)
      setTimeout(() => setFailed(false), 2500)
    }
  }

  const icon = (
    <Heart
      aria-hidden="true"
      className={`h-5 w-5 transition duration-300 ${saved ? 'scale-110 fill-carmin text-carmin' : 'text-white'} ${
        failed ? 'animate-pulse' : ''
      }`}
    />
  )

  if (variant === 'page') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className="flex min-h-12 items-center justify-center gap-2 rounded-full glass px-5 py-3 font-semibold transition hover:bg-white/10"
      >
        {icon}
        {failed ? 'Could not save' : saved ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
      title={failed ? 'Could not save. Try again.' : undefined}
      className="flex h-11 w-11 items-center justify-center rounded-full"
    >
      <span className="keep-dark flex h-9 w-9 items-center justify-center rounded-full bg-noche/60 backdrop-blur-md transition hover:bg-noche/80">
        {icon}
      </span>
    </button>
  )
}

export default FavoriteButton
