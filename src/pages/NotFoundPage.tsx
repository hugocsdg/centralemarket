import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
      <p className="text-5xl font-bold text-rojo">404</p>
      <h1 className="mt-2 text-2xl font-bold text-burdeos">Nothing here</h1>
      <p className="mt-2 text-gray-600">This page or listing doesn't exist (or was removed).</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-rojo px-5 py-2.5 text-sm font-semibold text-white">
        Back to home
      </Link>
    </div>
  )
}

export default NotFoundPage
