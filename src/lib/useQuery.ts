import { useEffect, useRef, useState } from 'react'

type State<T> = { key: string | null; data?: T; error?: string }

// Pide datos a Supabase y avisa de si están cargando, si han llegado o si hubo un error.
// "key" describe la petición: cuando cambia (p. ej. otra búsqueda), se vuelve a pedir.
// Con key = null no se pide nada (por ejemplo, si no has iniciado sesión).
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ key: null })
  const fetcherRef = useRef(fetcher)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    fetcherRef.current().then(
      (data) => !cancelled && setState({ key: `${key}#${version}`, data }),
      (error) => !cancelled && setState({ key: `${key}#${version}`, error: error?.message ?? 'Something went wrong.' }),
    )
    return () => {
      cancelled = true
    }
  }, [key, version])

  const fresh = state.key === `${key}#${version}`
  // Al recargar la misma petición, seguimos enseñando los datos anteriores mientras llegan los nuevos.
  const sameRequest = state.key?.startsWith(`${key}#`) ?? false
  const data = fresh || sameRequest ? state.data : undefined
  return {
    data,
    error: fresh ? state.error : undefined,
    loading: key !== null && !fresh && data === undefined,
    // Volver a pedir los datos (p. ej. después de editar algo).
    reload: () => setVersion((v) => v + 1),
  }
}
