// Fondo de la web inspirado en el del logo: casi negro con ondas burdeos y rojas que brillan.
// Va fijo detrás de todo (fixed + -z-10), así el contenido se desliza por encima.
function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-noche">
      <svg className="h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bg-wave-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E0153F" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#B51227" stopOpacity="0.55" />
            <stop offset="1" stopColor="#650038" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bg-wave-purple" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3A0A2E" stopOpacity="0.9" />
            <stop offset="1" stopColor="#12000A" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="bg-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#B51227" stopOpacity="0.45" />
            <stop offset="1" stopColor="#B51227" stopOpacity="0" />
          </radialGradient>
          <filter id="bg-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        {/* Gran onda oscura arriba a la izquierda */}
        <path d="M-100 -50 C 200 120, 420 60, 720 -80 L -100 -80 Z" fill="url(#bg-wave-purple)" />
        <path d="M-100 330 C 150 120, 520 60, 760 -60" fill="none" stroke="#4A0D35" strokeOpacity="0.6" strokeWidth="3" />

        {/* Ondas rojas a la derecha */}
        <path
          d="M1100 -50 C 860 120, 820 380, 1100 620 Z"
          fill="url(#bg-wave-red)"
          filter="url(#bg-blur)"
          opacity="0.75"
        />
        <path d="M1050 120 C 880 260, 860 520, 1060 760" fill="none" stroke="#E0153F" strokeOpacity="0.55" strokeWidth="2.5" />

        {/* Onda roja abajo a la izquierda */}
        <path
          d="M-100 1100 C 120 820, 320 760, 520 1100 Z"
          fill="url(#bg-wave-red)"
          filter="url(#bg-blur)"
          opacity="0.6"
        />
        <path d="M-80 900 C 140 760, 300 800, 480 1060" fill="none" stroke="#B51227" strokeOpacity="0.5" strokeWidth="2.5" />

        {/* Brillos suaves */}
        <circle cx="820" cy="200" r="260" fill="url(#bg-glow)" />
        <circle cx="120" cy="880" r="220" fill="url(#bg-glow)" />
      </svg>
    </div>
  )
}

export default Background
