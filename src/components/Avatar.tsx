import { useState } from 'react'

type AvatarProps = {
  name?: string | null
  url?: string | null
  // Tamaño y texto de la inicial, con clases de Tailwind (p. ej. "h-10 w-10 text-base").
  className?: string
}

// Foto de perfil redonda. Sin foto (o si no carga), la inicial del nombre sobre el degradado rojo.
function Avatar({ name, url, className = 'h-10 w-10 text-base' }: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const initial = name?.trim()[0]?.toUpperCase() ?? '?'

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-carmin to-burdeos font-bold text-white ${className}`}
    >
      {initial}
    </span>
  )
}

export default Avatar
