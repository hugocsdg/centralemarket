// Recordar en este dispositivo si ya se vio la página de introducción.
const KEY = 'cm-intro-seen'

export function introSeen() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // Navegación privada sin almacenamiento: no pasa nada.
  }
}
