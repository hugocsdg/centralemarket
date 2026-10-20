import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { supabase } from './supabase'

// Avisos dentro de la app (la campana). Los crea la base de datos (supabase/06_mejoras_vinted.sql):
// - price_drop: algo que tienes en favoritos ha bajado de precio
// - rate_seller: el vendedor te marcó como comprador → valórale
// - new_review: alguien te ha valorado

export type Notification = {
  id: number
  kind: 'price_drop' | 'rate_seller' | 'new_review'
  listing_id: number | null
  old_price: number | null
  new_price: number | null
  rating: number | null
  created_at: string
  read_at: string | null
  listing: { title: string; images: { path: string; position: number }[] } | null
}

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, listing:listings(title, images:listing_images(path, position))')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data as unknown as Notification[]
}

export async function markAllNotificationsRead() {
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
}

// Cuántos avisos sin leer tengo (para el numerito de la campana).
// Se actualiza al cambiar de página y en tiempo real cuando llega uno nuevo.
export function useNotificationCount(userId: string | undefined) {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const refresh = async () => {
      const { count: unread, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
      // Si la tabla aún no existe (falta ejecutar el SQL), la campana se queda a 0.
      if (!cancelled) setCount(error ? 0 : (unread ?? 0))
    }
    refresh()
    const channel = supabase
      .channel(`notifications-${userId}-${pathname}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refresh())
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId, pathname])

  return userId ? count : 0
}
