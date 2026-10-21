import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Flag, X } from 'lucide-react'
import { LISTING_REASONS, USER_REASONS, sendReport } from '../lib/reports'
import type { ReportReason, ReportTarget } from '../lib/reports'
import { useT } from '../i18n/lang'

// Enlace discreto "Report…" que abre un panel para elegir el motivo.
// Desde abajo en el móvil, ventana centrada en el ordenador (como los filtros).
function ReportButton({ target, label }: { target: ReportTarget; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-white/60 transition hover:text-rosa"
      >
        <Flag aria-hidden="true" className="h-4 w-4" /> {label}
      </button>
      {open && <ReportSheet target={target} title={label} onClose={() => setOpen(false)} />}
    </>
  )
}

function ReportSheet({ target, title, onClose }: { target: ReportTarget; title: string; onClose: () => void }) {
  const reasons = 'listingId' in target ? LISTING_REASONS : USER_REASONS
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'already' | 'error'>('idle')
  const [error, setError] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  const t = useT()
  const done = status === 'sent' || status === 'already'
  const needsDetails = reason === 'other' && details.trim().length < 5

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!reason || needsDetails) return
    setStatus('sending')
    setError('')
    try {
      setStatus(await sendReport(target, reason, details))
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not send the report.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label={t('Close')} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative flex max-h-[90dvh] w-full flex-col rounded-t-[2rem] border border-white/10 bg-grafito/95 shadow-2xl backdrop-blur-xl md:max-w-lg md:rounded-[2rem]">
        <span className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20 md:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between px-5 pt-3 pb-1 md:pt-5">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={t('Close')}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="px-5 pt-4 pb-8 text-center" role="status">
            <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-3 text-lg font-bold">
              {t(status === 'already' ? 'You already reported this' : 'Thanks, we got your report')}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-white/70">
              {t(
                'We review every report. The other person is not told who reported them. If you feel unsafe, stop replying and don’t meet up.',
              )}
            </p>
            <button
              onClick={onClose}
              className="mt-6 min-h-12 w-full rounded-full border border-white/20 px-5 font-semibold hover:border-white/40"
            >
              {t('Close')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 pb-4">
              <p className="text-sm text-white/70">{t('What’s wrong? Your report is anonymous.')}</p>
              <fieldset className="space-y-2">
                <legend className="sr-only">{t('Reason')}</legend>
                {reasons.map((option) => (
                  <label
                    key={option.value}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      reason === option.value ? 'border-carmin bg-rojo/15 ring-1 ring-carmin' : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      className="h-4 w-4 shrink-0 accent-[var(--color-carmin)]"
                    />
                    <span>
                      <span className="block font-semibold">{t(option.label)}</span>
                      <span className="block text-xs text-white/60">{t(option.hint)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white/80">
                  {t(reason === 'other' ? 'Details' : 'Details (optional)')}
                </span>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t('Anything that helps us understand what happened')}
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa"
                />
              </label>
            </div>
            <div className="border-t border-white/10 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {status === 'error' && (
                <p role="alert" className="mb-3 rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">
                  {t(error)}
                </p>
              )}
              <button
                disabled={!reason || needsDetails || status === 'sending'}
                className="min-h-12 w-full rounded-full btn-primary px-5 py-3 font-semibold disabled:opacity-50"
              >
                {t(status === 'sending' ? 'Sending…' : 'Send report')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReportButton
