import { Link } from 'react-router'
import { LogoMark } from '../components/Logo'

type ComingSoonPageProps = {
  title: string
  description: string
}

// Página temporal para las secciones que necesitan cuentas de usuario y base de datos.
function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
      <LogoMark className="mx-auto h-16 w-auto" />
      <h1 className="mt-4 text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-white/60">{description}</p>
      <p className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-rosa">Coming soon</p>
      <div className="mt-6">
        <Link to="/explore" className="rounded-full bg-gradient-to-r from-rojo to-carmin px-5 py-2.5 text-sm font-semibold text-white">
          Explore the marketplace
        </Link>
      </div>
    </div>
  )
}

export default ComingSoonPage
