// Prueba social REAL para la intro: cuántos estudiantes lo usan y frases de usuarios.
// Mientras "enabled" sea false, la sección no se ve. No inventar nada: solo datos y frases
// reales, con permiso de quien las dijo.
//
// Ejemplo cuando haya datos:
//   enabled: true,
//   students: 120,
//   quotes: [{ text: 'Sold my desk in two hours.', name: 'Léa', detail: '2A, Rés. IV' }],

export const socialProof: {
  enabled: boolean
  students: number | null
  quotes: { text: string; name: string; detail: string }[]
} = {
  enabled: false,
  students: null,
  quotes: [],
}
