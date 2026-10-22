type LogoMarkProps = {
  className?: string
}

// Cada logo tiene dos versiones: la original (para fondo oscuro) y otra para el modo claro
// (public/*-light.webp: las sombras de los pliegues sólidas y "Centrale" en negro; la hizo
// un script a partir del original). index.css enseña una u otra según el tema; la de modo claro
// lleva loading="lazy" para que solo se descargue si alguien usa el modo claro.

// Símbolo "CM": la imagen original del logo, recortada y sin fondo (public/logo-mark.webp; el original en PNG sigue en public/).
export function LogoMark({ className = 'h-9 w-auto' }: LogoMarkProps) {
  return (
    <>
      <img src="/logo-mark.webp" alt="" width={360} height={202} className={`logo-on-dark ${className}`} />
      <img src="/logo-mark-light.webp" alt="" width={360} height={202} loading="lazy" className={`logo-on-light ${className}`} />
    </>
  )
}

// Logo completo grande (símbolo + nombre), para la portada.
export function LogoFull({ className = 'w-full' }: LogoMarkProps) {
  return (
    <>
      <img src="/logo-full.png" alt="CentraleMarket" className={`logo-on-dark ${className}`} />
      <img src="/logo-full-light.webp" alt="CentraleMarket" loading="lazy" className={`logo-on-light ${className}`} />
    </>
  )
}

// Logo de la cabecera: símbolo + nombre escrito, para que se lea bien en pequeño.
function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className="h-8 w-auto sm:h-9" />
      <span className="font-logo text-lg font-bold tracking-tight whitespace-nowrap sm:text-xl">
        <span className="text-white">Centrale</span>
        <span className="text-carmin">Market</span>
      </span>
    </span>
  )
}

export default Logo
