import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { SELECT, withSortedImages } from './listings'
import type { Listing } from './listings'

// Favoritos: los anuncios que guardas con el corazón (tabla "favorites", supabase/04_favorites.sql).
//
// Los ids guardados se piden UNA vez al entrar y se comparten entre todas las tarjetas
// (una pequeña "memoria" común), así cada corazón sabe si está lleno sin preguntar a Supabase.
// Al pulsar, el corazón cambia al momento y luego se guarda; si falla, vuelve atrás.

type State = { ids: ReadonlySet<number>; ready: boolean }

let state: State = { ids: new Set(), ready: false }
let loadedFor: string | null = null
const listeners = new Set<() => void>()

function setState(next: State) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function loadIds(userId: string) {
  loadedFor = userId
  const { data, error } = await supabase.from('favorites').select('listing_id')
  if (loadedFor !== userId) return // mientras tanto cerró sesión o cambió de cuenta
  // Si la tabla aún no existe (falta ejecutar el SQL), seguimos sin favoritos.
  setState({ ids: new Set(error ? [] : data.map((row) => row.listing_id as number)), ready: true })
}

export function useFavorites() {
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (userId && loadedFor !== userId) loadIds(userId)
    if (!userId && loadedFor) {
      loadedFor = null
      setState({ ids: new Set(), ready: false })
    }
  }, [userId])

  const current = useSyncExternalStore(subscribe, () => state)

  // Guarda o quita un anuncio. Devuelve false si no se pudo guardar.
  async function toggle(listingId: number) {
    const saved = state.ids.has(listingId)
    const ids = new Set(state.ids)
    if (saved) ids.delete(listingId)
    else ids.add(listingId)
    setState({ ...state, ids })

    const { error } = saved
      ? await supabase.from('favorites').delete().eq('listing_id', listingId)
      : await supabase.from('favorites').insert({ listing_id: listingId })
    if (error) {
      const back = new Set(state.ids)
      if (saved) back.add(listingId)
      else back.delete(listingId)
      setState({ ...state, ids: back })
      return false
    }
    return true
  }

  return { ids: current.ids, ready: current.ready, signedIn: userId !== null, toggle }
}

// Tus anuncios guardados, del último que guardaste al primero.
export async function fetchFavoriteListings() {
  const { data, error } = await supabase
    .from('favorites')
    .select(`created_at, listing:listings(${SELECT})`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as unknown as { listing: Listing | null }[])
    .map((row) => row.listing)
    .filter((listing): listing is Listing => listing !== null)
    .map(withSortedImages)
}
