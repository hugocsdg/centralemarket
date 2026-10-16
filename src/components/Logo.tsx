type LogoMarkProps = {
  className?: string
}

// Símbolo "CM": una C lavanda y una M roja en forma de cinta.
// Es una aproximación en SVG del concepto de logo; se puede sustituir por el archivo final.
export function LogoMark({ className = 'h-9 w-auto' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 112 80" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cm-c" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EFE9F6" />
          <stop offset="100%" stopColor="#9B80B2" />
        </linearGradient>
        <linearGradient id="cm-m" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#650038" />
          <stop offset="45%" stopColor="#B51227" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <path d="M61.4 22 A28 28 0 1 0 61.4 58" fill="none" stroke="url(#cm-c)" strokeWidth="15" />
      <path
        d="M44 36 L64 56 L86 26 L98 26 L98 66"
        fill="none"
        stroke="url(#cm-m)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type LogoProps = {
  inverted?: boolean
}

// Logo completo: símbolo + nombre. "inverted" para fondos oscuros.
function Logo({ inverted = false }: LogoProps) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-xl font-bold tracking-tight">
        <span className={inverted ? 'text-white' : 'text-burdeos'}>Centrale</span>
        <span className="text-rojo">Market</span>
      </span>
    </span>
  )
}

export default Logo
