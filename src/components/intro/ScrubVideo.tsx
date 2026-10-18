import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'

// Vídeo que avanza con el scroll (hacia abajo) y retrocede al subir.
// - Mientras no hay vídeo (o en móvil, o con "reducir movimiento"), se ve la imagen fija.
// - El vídeo se descarga entero de una vez (Blob): así se puede saltar a cualquier momento
//   aunque el servidor no permita descargas parciales.
// - El tiempo que se muestra "persigue" al scroll con suavidad (lerp) y se para cuando llega.
// - Nunca se pide un salto nuevo mientras el anterior no ha terminado (si no, se atasca).
// La escena que lo usa llama a seek(progreso de 0 a 1) desde su ScrollTrigger.

export type ScrubHandle = { seek: (progress: number) => void; enable: () => void }

type Props = {
  ref?: Ref<ScrubHandle>
  src?: string
  // Imagen fija: varias resoluciones para escritorio y un recorte vertical para el móvil.
  poster: { src: string; srcSet: string; mobile: string }
  alt?: string
  priority?: boolean
  className?: string
}

function ScrubVideo({ ref, src, poster, alt = '', priority = false, className = '' }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const state = useRef({
    target: 0,
    shown: 0,
    raf: 0,
    last: 0,
    busy: false,
    busyAt: 0,
    pending: null as number | null,
    loading: false,
  })

  const requestSeek = (time: number) => {
    const v = video.current
    const s = state.current
    if (!v || !v.duration) return
    // Si ya está en ese momento, no hace falta saltar (y el navegador no avisaría al terminar).
    if (Math.abs(v.currentTime - time) < 0.01) return
    // Seguridad: si un salto no avisa en 300 ms, no nos quedamos bloqueados.
    if (s.busy && performance.now() - s.busyAt < 300) {
      s.pending = time
      return
    }
    s.busy = true
    s.busyAt = performance.now()
    v.currentTime = time
  }

  const tick = (now: number) => {
    const s = state.current
    const v = video.current
    const dt = Math.min(100, now - (s.last || now))
    s.last = now
    s.shown += (s.target - s.shown) * (1 - Math.pow(1 - 0.16, dt / 16.667))
    if (Math.abs(s.target - s.shown) < 0.0005) {
      s.shown = s.target
      s.raf = 0
      s.last = 0
    } else {
      s.raf = requestAnimationFrame(tick)
    }
    if (v?.duration) requestSeek(s.shown * (v.duration - 0.05))
  }

  useImperativeHandle(ref, () => ({
    seek(progress) {
      const s = state.current
      s.target = Math.min(1, Math.max(0, progress))
      if (!s.raf) s.raf = requestAnimationFrame(tick)
    },
    // Descargar el vídeo (solo cuando la escena está en modo vídeo).
    enable() {
      const s = state.current
      if (!src || s.loading) return
      s.loading = true
      const controller = new AbortController()
      const watchdog = setTimeout(() => controller.abort(), 20000)
      fetch(src, { priority: 'low', signal: controller.signal } as RequestInit)
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status))
          return res.blob()
        })
        .then((blob) => {
          const v = video.current
          if (!v) return
          v.src = URL.createObjectURL(blob)
          v.load()
        })
        .catch(() => setFailed(true))
        .finally(() => clearTimeout(watchdog))
    },
  }))

  useEffect(() => {
    const v = video.current
    if (!v) return
    const onSeeked = () => {
      const s = state.current
      s.busy = false
      if (s.pending !== null) {
        const t = s.pending
        s.pending = null
        requestSeek(t)
      }
    }
    const onReady = () => {
      setReady(true)
      requestSeek(state.current.shown * (v.duration - 0.05))
    }
    const onError = () => {
      state.current.busy = false
      state.current.pending = null
      setFailed(true)
    }
    v.addEventListener('seeked', onSeeked)
    v.addEventListener('canplay', onReady, { once: true })
    v.addEventListener('error', onError)
    const s = state.current
    return () => {
      v.removeEventListener('seeked', onSeeked)
      v.removeEventListener('canplay', onReady)
      v.removeEventListener('error', onError)
      cancelAnimationFrame(s.raf)
      s.raf = 0 // si no, el siguiente seek creería que el bucle sigue en marcha
      s.last = 0
      if (v.src.startsWith('blob:')) URL.revokeObjectURL(v.src)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <picture>
        <source media="(max-width: 720px)" srcSet={poster.mobile} />
        <img
          src={poster.src}
          srcSet={poster.srcSet}
          sizes="100vw"
          alt={alt}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      {src && !failed && (
        <video
          ref={video}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          className={`scrub-video absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}

export default ScrubVideo
