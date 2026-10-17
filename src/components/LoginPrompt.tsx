import { Link, useLocation } from 'react-router'
import { Lock } from 'lucide-react'

// Se muestra en lugar de los anuncios cuando no has iniciado sesión:
// el mercado es solo para estudiantes de CentraleSupélec.
function LoginPrompt({ title = 'Students only' }: { title?: string }) {
  const location = useLocation()
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
      <Lock className="mx-auto h-8 w-8 text-rosa" />
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">
        Log in with your @student-cs.fr email to see what fellow students are selling. It takes 30 seconds, no password
        needed.
      </p>
      <Link
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        className="mt-5 inline-block rounded-full bg-gradient-to-r from-rojo to-carmin px-5 py-2.5 text-sm font-semibold shadow-lg shadow-rojo/30"
      >
        Log in to browse
      </Link>
    </div>
  )
}

export default LoginPrompt
