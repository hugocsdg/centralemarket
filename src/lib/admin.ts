import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { SELECT } from './listings'
import type { Listing } from './listings'

// Panel de administración (/admin), solo para los administradores (tabla admins, supabase/11_admin.sql).
// La base de datos comprueba en cada acción que eres administrador: esconder el botón es solo comodidad.

// ¿Soy administrador? (para enseñar el botón en Profile y dejar entrar en /admin)
export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  useEffect(() => {
    if (!userId) return
    let alive = true
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => alive && setIsAdmin(!error && Boolean(data)))
    return () => {
      alive = false
    }
  }, [userId])
  return userId ? isAdmin : false
}

export type Stats = {
  users: number
  users_week: number
  listings: number
  listings_available: number
  listings_week: number
  sold: number
  conversations: number
  messages_week: number
  reviews: number
  rating: number | null
  open_reports: number
  banned: number
  push_devices: number
}

export async function fetchStats() {
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw error
  return data as Stats
}

export type ReportRow = {
  id: number
  created_at: string
  status: 'open' | 'dismissed' | 'resolved'
  reason: string
  details: string
  reported_by: string
  type: 'listing' | 'user'
  listing_title: string | null
  against: string | null
  listing_id: number | null
  reported_user_id: string | null
  against_id: string | null
}

export async function fetchReports(status: 'open' | 'closed') {
  const query = supabase.from('reports_overview').select('*').order('created_at', { ascending: false }).limit(100)
  const { data, error } = await (status === 'open' ? query.eq('status', 'open') : query.neq('status', 'open'))
  if (error) throw error
  return data as ReportRow[]
}

// Cerrar denuncias: 'dismissed' = sin motivo (si el anuncio estaba oculto, vuelve a verse); 'resolved' = actuamos.
export async function closeReports(ids: number[], status: 'dismissed' | 'resolved') {
  const { error } = await supabase.from('reports').update({ status }).in('id', ids)
  if (error) throw error
}

export type AdminUser = {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
  created_at: string
  banned_at: string | null
  ban_reason: string | null
  listings: number
  reports: number
  rating: number | null
}

export async function searchUsers(search: string) {
  const { data, error } = await supabase.rpc('admin_search_users', { search: search.trim() })
  if (error) throw error
  return data as AdminUser[]
}

export async function setBan(userId: string, banned: boolean, reason?: string) {
  const { error } = await supabase.rpc('admin_set_ban', { target: userId, banned, reason: reason ?? null })
  if (error) throw error
}

// Buscar cualquier anuncio (los administradores ven también los ocultos).
export async function searchAllListings(search: string) {
  let query = supabase.from('listings').select(SELECT).order('created_at', { ascending: false }).limit(40)
  if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)
  const { data, error } = await query
  if (error) throw error
  return data as unknown as Listing[]
}

// Crecimiento (Admin → Growth, supabase/15_crecimiento.sql): quién se une y quién usa la app.
export type GrowthDay = { day: string; joined: number; listings: number; messages: number; active: number }

export type GrowthUser = {
  id: string
  display_name: string
  avatar_url: string | null
  email: string
  created_at: string
  last_seen: string | null
  listings: number
  messages: number
  push: boolean
}

export type Growth = {
  totals: {
    users: number
    joined_today: number
    joined_week: number
    joined_prev_week: number
    active_today: number
    active_week: number
    never_back: number
  }
  daily: GrowthDay[]
  funnel: { joined: number; acted: number; listed: number; sold: number }
  latest: GrowthUser[]
}

export async function fetchGrowth(days = 30) {
  const { data, error } = await supabase.rpc('admin_growth', { days })
  if (error) throw error
  return data as Growth
}
