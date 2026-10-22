import { supabase } from './supabase'

// Bloquear a otro estudiante (supabase/11_admin.sql): dejas de ver sus anuncios y no puede escribirte
// ni empezar un chat contigo. No se entera de que le has bloqueado. Se puede deshacer.

export type BlockedPerson = { blocked_id: string; created_at: string; person: { display_name: string; avatar_url: string | null } | null }

export async function fetchBlocked() {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at, person:profiles!blocks_blocked_id_fkey(display_name, avatar_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as BlockedPerson[]
}

export async function isBlocked(userId: string) {
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocked_id', userId).maybeSingle()
  return Boolean(data)
}

export async function blockUser(userId: string) {
  const { error } = await supabase.from('blocks').insert({ blocked_id: userId })
  if (error && error.code !== '23505') throw new Error('Could not block this person. Please try again.')
}

export async function unblockUser(userId: string) {
  const { error } = await supabase.from('blocks').delete().eq('blocked_id', userId)
  if (error) throw new Error('Could not unblock this person. Please try again.')
}
