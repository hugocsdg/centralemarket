import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { fetchUnreadConversationIds, subscribeToMessages } from './chat'

// Cuántas conversaciones tienen mensajes sin leer (para el puntito rojo del menú).
// Se actualiza al cambiar de página y en tiempo real cuando llega un mensaje.
export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const refresh = () =>
      fetchUnreadConversationIds(userId).then(
        (ids) => !cancelled && setCount(ids.size),
        () => {},
      )
    refresh()
    const unsubscribe = subscribeToMessages(`unread-${userId}-${pathname}`, () => refresh())
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId, pathname])

  return userId ? count : 0
}
