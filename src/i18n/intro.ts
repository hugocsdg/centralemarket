import type { Lang } from './lang'

// Todos los textos de la página de introducción (/welcome).
// Para cambiar una frase, cámbiala aquí: los componentes solo la leen.
// La versión en francés llegará en el paso del idioma; mientras tanto usa la inglesa.

const en = {
  nav: {
    skip: 'Skip intro',
    login: 'Log in',
    getStarted: 'Get started',
    enter: 'Enter marketplace',
    chapters: 'Chapters',
  },
  chapters: {
    campus: 'Campus',
    market: 'The market',
    order: 'In order',
    how: 'How it works',
    life: 'Your year',
    join: 'Join',
  },
  hero: {
    badge: 'Only for CentraleSupélec students',
    titleTop: 'The campus marketplace',
    titleBottom: 'you were waiting for.',
    sub: 'Buy and sell with people from your own school. Hand it over on campus.',
    how: 'How it works',
    trust: ['@student-cs.fr only', '0\u00a0€ fees, always', 'Meet on campus'],
    windows: 'Every lit window is someone with something to sell.',
    scroll: 'Scroll',
  },
  campus: [
    {
      title: 'Your campus. The real one.',
      text: 'Eiffel, Bréguet, Bouygues and the six César residences. Every deal happens here.',
    },
    {
      title: 'Everyone is a neighbour.',
      text: 'Your buyer lives in Rés. IV. Your seller has class in Bréguet until six.',
    },
    {
      title: 'No shipping. No strangers.',
      text: 'Every deal is a short walk away, and every account is an @student-cs.fr address.',
    },
  ],
  market: {
    title: 'From an 8\u00a0€ lamp to a 280\u00a0€ bike.',
    text: 'If it fits in a student room, someone on campus is selling it.',
    items: [
      { name: 'Desk lamp', price: 8, where: 'Pick up at Rés. II' },
      { name: 'Headphones', price: 40, where: 'Pick up in Bréguet' },
      { name: 'City bike', price: 280, where: 'Pick up at Rés. VI' },
    ],
    example: 'Example listings',
  },
  order: {
    chaosTitle: 'Everything gets lost in WhatsApp.',
    chaosText: 'Hundreds of messages a day. That 8\u00a0€ lamp? Buried in minutes.',
    orderTitle: 'Everything in order.',
    orderText: 'Every item with photos, a price and a category. Searchable. Always up to date.',
    hold: 'Hold to put it in order',
    holdHint: 'Press and hold the button, or hold the space bar.',
    reducedHold: 'Put it in order',
    replay: 'Back to the chaos',
    done: 'Sorted. This is CentraleMarket.',
    group: 'Campus buy & sell',
    members: 'Léa, Tom, Inès, Marco, Yuki…',
    search: 'Search lamps, bikes, desks…',
    ticket: { name: 'Gala ticket', price: 12 },
    messages: [
      { who: 'Léa', text: 'Selling desk lamp 8€ 💡 DM me', lamp: true },
      { who: 'Tom', text: 'anyone has a printer??' },
      { who: 'Inès', text: 'Party tickets for Friday 🎉 12€' },
      { who: 'Marco', text: 'who left a bike at the station' },
      { who: 'Yuki', text: 'Selling chair 25€, pickup tonight' },
      { who: 'Sam', text: 'Free pasta tonight 🍝 come by' },
      { who: 'Pablo', text: 'is the lamp still available?' },
      { who: 'Anna', text: 'Looking for a kettle!!' },
      { who: 'Hugo', text: 'mini fridge 40€ anyone?' },
      { who: 'Chloé', text: 'lost my keys in the gym 😭' },
      { who: 'Ali', text: 'selling calculator, like new' },
      { who: 'Emma', text: 'who is going to Paris tomorrow' },
      { who: 'Noah', text: 'Desk + chair bundle 35€' },
      { who: 'Lina', text: 'ticket for the gala??' },
      { who: 'Pablo', text: 'hello?? the lamp??' },
    ],
  },
  how: {
    steps: [
      {
        title: 'Sign in with your student email.',
        text: 'Type your @student-cs.fr address and the code we send you. No password.',
      },
      { title: 'List it in under a minute.', text: 'A few photos, a title, a price. Published.' },
      { title: 'Chat inside the app.', text: 'Buyers message you right here. Your number stays private.' },
      { title: 'Meet on campus. Sold.', text: 'Hand it over and mark it as sold. Done.' },
    ],
    stepLabel: 'Step',
    ctaTitle: 'That is the whole thing.',
    ctaText: 'Four steps, all on campus.',
  },
  life: {
    title: 'Made for the way a year on campus goes.',
    moments: [
      { title: 'Arrive.', text: 'Furnish your room in a weekend. Second-hand, picked up a few minutes away.' },
      { title: 'Stay.', text: 'Sell what you stopped using. Find what you need between two classes.' },
      { title: 'Leave.', text: 'Sell before your flight home, not the night before it.' },
    ],
    storageTitle: 'Coming later: Campus Storage.',
    storageText:
      "Leaving before you've sold everything? We want to let you store it on campus and keep selling from home. It depends on the school, and we're working on it.",
  },
  proof: {
    title: 'Already on campus',
    students: (n: number) => `${n} CentraleSupélec students already use it.`,
  },
  final: {
    title: 'Light up your window.',
    text: 'All you need is your @student-cs.fr email. It takes 30 seconds.',
  },
  footer: {
    about: 'An independent student initiative for the CentraleSupélec community.',
    osm: 'Map © OpenStreetMap contributors',
  },
}

export type IntroCopy = typeof en

export const introCopy: Record<Lang, IntroCopy> = { en, fr: en }
