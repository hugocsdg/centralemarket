import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
      <p className="text-5xl font-bold text-carmin">404</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Nothing here</h1>
      <p className="mt-2 text-white/60">This page or listing doesn't exist (or was removed).</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-gradient-to-r from-rojo to-carmin px-5 py-2.5 text-sm font-semibold text-white">
        Back to home
      </Link>
    </div>
  )
}

export default NotFoundPage
