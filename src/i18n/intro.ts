import type { Lang } from './lang'

// Todos los textos de la página de introducción (/welcome).
// Para cambiar una frase, cámbiala aquí: los componentes solo la leen.
// Hay una versión en inglés (en) y otra en francés (fr), con las mismas claves.
// En francés va un espacio fino que no se corta antes de ? ! : y del símbolo € (\u00a0).

const en = {
  nav: {
    skip: 'Skip intro',
    login: 'Log in',
    getStarted: 'Get started',
    enter: 'Enter marketplace',
    chapters: 'Chapters',
    language: 'Language',
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

const fr: IntroCopy = {
  nav: {
    skip: 'Passer l’intro',
    login: 'Se connecter',
    getStarted: 'Commencer',
    enter: 'Aller au marché',
    chapters: 'Chapitres',
    language: 'Langue',
  },
  chapters: {
    campus: 'Campus',
    market: 'Le marché',
    order: 'En ordre',
    how: 'Comment ça marche',
    life: 'Ton année',
    join: 'Rejoindre',
  },
  hero: {
    badge: 'Réservé aux étudiants de CentraleSupélec',
    titleTop: 'La marketplace du campus',
    titleBottom: 'que tu attendais.',
    sub: 'Achète et vends entre étudiants de ton école. La remise se fait sur le campus.',
    how: 'Comment ça marche',
    trust: ['Uniquement @student-cs.fr', '0 € de frais, toujours', 'Rendez-vous sur le campus'],
    windows: 'Chaque fenêtre allumée, c’est quelqu’un qui a quelque chose à vendre.',
    scroll: 'Défiler',
  },
  campus: [
    {
      title: 'Ton campus. Le vrai.',
      text: 'Eiffel, Bréguet, Bouygues et les six résidences du César. Tout se passe ici.',
    },
    {
      title: 'Tout le monde est voisin.',
      text: 'Ton acheteur vit à la Rés. IV. Ta vendeuse a cours à Bréguet jusqu’à 18 h.',
    },
    {
      title: 'Pas de livraison. Pas d’inconnus.',
      text: 'Chaque échange est à quelques minutes à pied, et chaque compte est une adresse @student-cs.fr.',
    },
  ],
  market: {
    title: 'D’une lampe à 8 € à un vélo à 280 €.',
    text: 'Si ça rentre dans une chambre d’étudiant, quelqu’un le vend sur le campus.',
    items: [
      { name: 'Lampe de bureau', price: 8, where: 'À récupérer à la Rés. II' },
      { name: 'Casque audio', price: 40, where: 'À récupérer à Bréguet' },
      { name: 'Vélo de ville', price: 280, where: 'À récupérer à la Rés. VI' },
    ],
    example: 'Annonces d’exemple',
  },
  order: {
    chaosTitle: 'Sur WhatsApp, tout se perd.',
    chaosText: 'Des centaines de messages par jour. La lampe à 8 € ? Noyée en quelques minutes.',
    orderTitle: 'Ici, tout est en ordre.',
    orderText: 'Chaque objet avec ses photos, son prix et sa catégorie. Facile à chercher. Toujours à jour.',
    hold: 'Maintiens pour tout ranger',
    holdHint: 'Garde le bouton appuyé, ou maintiens la barre d’espace.',
    reducedHold: 'Tout ranger',
    replay: 'Revenir au chaos',
    done: 'Rangé. Voilà CentraleMarket.',
    group: 'Achat-vente campus',
    members: 'Léa, Tom, Inès, Marco, Yuki…',
    search: 'Cherche une lampe, un vélo, un bureau…',
    ticket: { name: 'Place pour le gala', price: 12 },
    messages: [
      { who: 'Léa', text: 'Je vends lampe de bureau 8€ 💡 MP', lamp: true },
      { who: 'Tom', text: 'qqn a une imprimante ??' },
      { who: 'Inès', text: 'Places soirée vendredi 🎉 12€' },
      { who: 'Marco', text: 'qui a laissé un vélo à la gare' },
      { who: 'Yuki', text: 'Je vends chaise 25€, dispo ce soir' },
      { who: 'Sam', text: 'Pâtes gratuites ce soir 🍝 passez' },
      { who: 'Pablo', text: 'la lampe est toujours dispo ?' },
      { who: 'Anna', text: 'Je cherche une bouilloire !!' },
      { who: 'Hugo', text: 'mini frigo 40€ quelqu’un ?' },
      { who: 'Chloé', text: 'j’ai perdu mes clés au gymnase 😭' },
      { who: 'Ali', text: 'vends calculatrice, comme neuve' },
      { who: 'Emma', text: 'qui va à Paris demain' },
      { who: 'Noah', text: 'Lot bureau + chaise 35€' },
      { who: 'Lina', text: 'une place pour le gala ??' },
      { who: 'Pablo', text: 'allô ?? la lampe ??' },
    ],
  },
  how: {
    steps: [
      {
        title: 'Connecte-toi avec ton email étudiant.',
        text: 'Tape ton adresse @student-cs.fr et le code qu’on t’envoie. Pas de mot de passe.',
      },
      { title: 'Publie en moins d’une minute.', text: 'Quelques photos, un titre, un prix. C’est en ligne.' },
      { title: 'Discute dans l’app.', text: 'Les acheteurs t’écrivent ici. Ton numéro reste privé.' },
      { title: 'Rendez-vous sur le campus. Vendu.', text: 'Tu remets l’objet et tu le marques comme vendu. Terminé.' },
    ],
    stepLabel: 'Étape',
    ctaTitle: 'C’est tout.',
    ctaText: 'Quatre étapes, toutes sur le campus.',
  },
  life: {
    title: 'Pensé pour une année sur le campus.',
    moments: [
      { title: 'Arriver.', text: 'Meuble ta chambre en un week-end. D’occasion, à quelques minutes à pied.' },
      { title: 'Rester.', text: 'Vends ce qui ne te sert plus. Trouve ce qu’il te faut entre deux cours.' },
      { title: 'Partir.', text: 'Vends avant ton vol retour, pas la veille au soir.' },
    ],
    storageTitle: 'Bientôt : Campus Storage.',
    storageText:
      'Tu pars avant d’avoir tout vendu ? On aimerait te permettre de stocker tes affaires sur le campus et de continuer à vendre depuis chez toi. Ça dépend de l’école, et on y travaille.',
  },
  proof: {
    title: 'Déjà sur le campus',
    students: (n: number) => `${n} étudiants de CentraleSupélec l’utilisent déjà.`,
  },
  final: {
    title: 'Allume ta fenêtre.',
    text: 'Il te faut juste ton email @student-cs.fr. Ça prend 30 secondes.',
  },
  footer: {
    about: 'Une initiative étudiante indépendante pour la communauté CentraleSupélec.',
    osm: 'Carte © les contributeurs d’OpenStreetMap',
  },
}

export const introCopy: Record<Lang, IntroCopy> = { en, fr }
