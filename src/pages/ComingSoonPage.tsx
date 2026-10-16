import { Link } from 'react-router'
import { LogoMark } from '../components/Logo'

type ComingSoonPageProps = {
  title: string
  description: string
}

// Página temporal para las secciones que necesitan cuentas de usuario y base de datos.
function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
      <LogoMark className="mx-auto h-14 w-auto" />
      <h1 className="mt-4 text-2xl font-bold text-burdeos">{title}</h1>
      <p className="mt-2 text-gray-600">{description}</p>
      <p className="mt-4 inline-block rounded-full bg-lavanda px-3 py-1 text-xs font-medium text-burdeos">Coming soon</p>
      <div className="mt-6">
        <Link to="/explore" className="rounded-full bg-rojo px-5 py-2.5 text-sm font-semibold text-white">
          Explore the marketplace
        </Link>
      </div>
    </div>
  )
}

export default ComingSoonPage
