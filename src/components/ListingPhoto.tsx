import { useState } from 'react'
import { imageUrl, thumbUrl } from '../lib/listings'

// Foto de un anuncio en tamaño pequeño (tarjetas, listas, chats): usa la miniatura de 600 px.
// Si el anuncio es anterior a las miniaturas (o falta), carga la foto grande sin que se note.
function ListingPhoto({
  path,
  alt = '',
  className,
  loading = 'lazy',
}: {
  path: string
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <img
      src={failed === path ? imageUrl(path) : thumbUrl(path)}
      onError={() => failed !== path && setFailed(path)}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
    />
  )
}

export default ListingPhoto
