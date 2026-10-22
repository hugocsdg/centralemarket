import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { reportError } from '../lib/errors'
import { translate as t } from '../i18n/core'

// Si una pantalla falla, en vez de dejar la página en blanco enseña "Algo ha fallado" con un botón
// para recargar, y guarda el error (Admin → Errors).
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(Object.assign(error, { stack: `${error.stack ?? ''}\n--- component ---${info.componentStack ?? ''}` }), 'screen')
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-md rounded-3xl glass p-8 text-center">
        <p className="text-5xl" aria-hidden="true">
          😵
        </p>
        <h1 className="mt-3 text-2xl font-bold">{t('Something went wrong')}</h1>
        <p className="mt-2 text-white/70">{t('We’ve been notified and will fix it. Reloading usually helps.')}</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full btn-primary px-6 font-semibold"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" /> {t('Reload')}
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
