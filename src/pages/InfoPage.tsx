import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { INFO_PAGES } from '../content/info'
import NotFoundPage from './NotFoundPage'
import { useT } from '../i18n/lang'

// Páginas de ayuda y legales (/info/how-it-works, /info/safety, /info/rules, /info/privacy).
// Los textos están en src/content/info.ts.
function InfoPage() {
  const { slug = '' } = useParams()
  const page = INFO_PAGES[slug]
  const t = useT()
  if (!page) return <NotFoundPage />

  return (
    <article className="mx-auto max-w-2xl">
      <Link
        to="/profile"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t('Profile')}
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-balance">{t(page.title)}</h1>
      <p className="mt-3 text-lg text-white/75">{t(page.intro)}</p>
      {page.updated && <p className="mt-2 text-sm text-white/60">{t('Last updated: {date}', { date: t(page.updated) })}</p>}

      <div className="mt-8 space-y-4">
        {page.sections.map((section) => (
          <section key={section.title} className="rounded-3xl glass p-6">
            <h2 className="text-lg font-bold">{t(section.title)}</h2>
            {section.body && <p className="mt-2 leading-relaxed text-white/75">{t(section.body)}</p>}
            {section.points && (
              <ul className="mt-3 space-y-2">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3 leading-relaxed text-white/75">
                    <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-carmin" />
                    {t(point)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}

export default InfoPage
