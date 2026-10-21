import { supabase } from './supabase'

// Búsquedas guardadas: cuando alguien publica algo que coincide, te llega un aviso
// (lo comprueba la base de datos al publicar, ver supabase/09_push.sql).
// Coincide si es de esa categoría, cuesta como mucho el máximo y tiene todas las palabras buscadas.

export type SavedSearch = {
  id: number
  query: string
  category: string | null
  max_price: number | null
  created_at: string
}

export type SearchCriteria = { query: string; category: string | null; max_price: number | null }

export async function fetchSavedSearches() {
  const { data, error } = await supabase.from('saved_searches').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as SavedSearch[]
}

export function sameSearch(a: SearchCriteria, b: SearchCriteria) {
  return (
    a.query.trim().toLowerCase() === b.query.trim().toLowerCase() &&
    (a.category ?? null) === (b.category ?? null) &&
    (a.max_price === null ? null : Number(a.max_price)) === (b.max_price === null ? null : Number(b.max_price))
  )
}

export async function saveSearch(criteria: SearchCriteria) {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({ query: criteria.query.trim().slice(0, 80), category: criteria.category, max_price: criteria.max_price })
    .select('*')
    .single()
  if (error) throw new Error(error.message.includes('20') ? 'You can save up to 20 searches.' : 'Could not save the search.')
  return data as SavedSearch
}

export async function deleteSavedSearch(id: number) {
  const { error } = await supabase.from('saved_searches').delete().eq('id', id)
  if (error) throw new Error('Could not delete the search.')
}
