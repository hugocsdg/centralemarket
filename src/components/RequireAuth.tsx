import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import Splash from './Splash'

// Si no has iniciado sesión, te manda a /login y luego te devuelve a donde ibas.
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Splash />
  if (!session) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

export default RequireAuth
