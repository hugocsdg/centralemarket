type LogoMarkProps = {
  className?: string
}

// Símbolo "CM": la imagen original del logo, recortada y sin fondo (public/logo-mark.png).
export function LogoMark({ className = 'h-9 w-auto' }: LogoMarkProps) {
  return <img src="/logo-mark.png" alt="" className={className} />
}

// Logo completo grande (símbolo + nombre), para la portada.
export function LogoFull({ className = 'w-full' }: LogoMarkProps) {
  return <img src="/logo-full.png" alt="CentraleMarket" className={className} />
}

// Logo de la cabecera: símbolo + nombre escrito, para que se lea bien en pequeño.
function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-logo text-xl font-bold tracking-tight">
        <span className="text-white">Centrale</span>
        <span className="text-carmin">Market</span>
      </span>
    </span>
  )
}

export default Logo
