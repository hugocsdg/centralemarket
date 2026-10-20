// Pantalla de carga de la app (logo con brillo rojo, nombre y línea de progreso).
// Los estilos están en index.html: así la misma pantalla sale al instante, antes de que llegue el
// código, y React la sigue enseñando mientras comprueba la sesión o descarga la página.
// "cm-splash-continue" quita la animación de entrada, porque ya se estaba viendo.
function Splash() {
  return (
    <div className="cm-splash cm-splash-continue" role="status" aria-label="Loading CentraleMarket">
      <div className="cm-splash-logo">
        <img src="/logo-mark.webp" alt="" width={360} height={202} />
      </div>
      <p className="cm-splash-name">
        Centrale<span>Market</span>
      </p>
      <p className="cm-splash-tagline">Your campus. Your marketplace.</p>
      <div className="cm-splash-bar" />
    </div>
  )
}

export default Splash
