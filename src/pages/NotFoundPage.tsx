import { Link } from 'react-router'
import { useT } from '../i18n/lang'

function NotFoundPage() {
  const t = useT()
  return (
    <div className="mx-auto max-w-md rounded-3xl glass p-8 text-center backdrop-blur-sm">
      <p className="text-5xl font-bold text-carmin">404</p>
      <h1 className="mt-2 text-2xl font-bold text-white">{t('Nothing here')}</h1>
      <p className="mt-2 text-white/60">{t("This page or listing doesn't exist (or was removed).")}</p>
      <Link to="/" className="mt-6 inline-block rounded-full btn-primary px-5 py-2.5 text-sm font-semibold text-white">
        {t('Back to home')}
      </Link>
    </div>
  )
}

export default NotFoundPage
