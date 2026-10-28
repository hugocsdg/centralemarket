// Textos de las páginas de ayuda y legales (/info/<página>), enlazadas desde el menú de Profile.
// Son un primer borrador escrito para CentraleMarket: revisadlos antes de abrir la app a todo el campus.
// No son asesoría legal.

export type InfoSection = { title: string; body?: string; points?: string[] }
export type InfoPage = { title: string; intro: string; updated?: string; sections: InfoSection[] }

export const INFO_PAGES: Record<string, InfoPage> = {
  'how-it-works': {
    title: 'How CentraleMarket works',
    intro: 'A marketplace only for CentraleSupélec students. No shipping, no fees: everything happens on campus.',
    sections: [
      {
        title: '1. Sign in with your student email',
        body: 'Type your @student-cs.fr address and the code we send you, then choose a password for next time.',
      },
      {
        title: '2. List an item in under a minute',
        body: 'Add a few photos, a title, a price and where to pick it up. It is visible to every student straight away.',
      },
      {
        title: '3. Chat inside the app',
        body: 'Buyers message you here. Your phone number and email stay private.',
      },
      {
        title: '4. Meet on campus',
        body: 'Agree on a time and place, hand it over, and mark the listing as sold. Selling is free, always.',
      },
    ],
  },
  safety: {
    title: 'Safety tips',
    intro: 'Everyone here has a CentraleSupélec email, but a few habits keep every deal smooth.',
    sections: [
      {
        title: 'Meet in a busy place',
        points: [
          'Pick a public spot on campus: a building hall, the cafeteria, the entrance of a residence.',
          'Prefer daylight, and bring a friend if you feel more comfortable.',
        ],
      },
      {
        title: 'Check before you pay',
        points: [
          'Look at the item and try it if you can (switch the lamp on, ride the bike).',
          'Pay when you get the item, never in advance.',
          'Agree on the payment method in the chat before meeting.',
        ],
      },
      {
        title: 'Keep it in the app',
        points: [
          'Keep the conversation in the CentraleMarket chat, so there is a record.',
          'We will never ask for your login code. Never share it with anyone.',
          'Be careful with links to other websites or requests to pay through them.',
        ],
      },
      {
        title: 'Links and payments',
        points: [
          'Never open a link that asks you to pay, log in or “confirm” your account. CentraleMarket never sends payment links.',
          'Pay in person when you get the item. Never send money in advance to someone you haven’t met.',
          'Messages with links show a warning, and new accounts can’t send links during their first hours.',
        ],
      },
      {
        title: 'If your school email is hacked',
        points: [
          'Change your school password right away and tell the CentraleSupélec IT service.',
          'Write to us at centralemarket.contact@gmail.com: we can block your CentraleMarket account until it’s safe again.',
          'If a friend’s account suddenly asks you for money or codes, check with them another way (in person or by phone).',
        ],
      },
      {
        title: 'Limits that protect everyone',
        body: 'To stop scams from stolen accounts, there are generous limits on new chats, messages and listings per day. Normal use, even selling everything before you leave, never reaches them.',
      },
      {
        title: 'Trust your instincts',
        body: 'If a deal feels wrong (a price too good to be true, pressure to hurry), walk away.',
      },
      {
        title: 'Report problems',
        body: 'Use “Report this listing” at the bottom of any listing, or “Report” on a student’s profile. Reports are anonymous and we review every one.',
      },
    ],
  },
  rules: {
    title: 'Community rules',
    intro: 'CentraleMarket works because we trust each other. These rules keep it that way.',
    updated: 'October 2026',
    sections: [
      {
        title: 'Who can use CentraleMarket',
        body: 'Only CentraleSupélec students with an @student-cs.fr email. One account per person.',
      },
      {
        title: 'Honest listings',
        points: [
          'Use real photos of the item you are selling.',
          'Describe its condition honestly, including any defects.',
          'Mark the listing as reserved or sold as soon as it is.',
          'One listing per item: no duplicates or spam.',
        ],
      },
      {
        title: 'Not allowed',
        points: [
          'Anything illegal, stolen or counterfeit.',
          'Weapons, drugs, alcohol, tobacco and vapes, medicines.',
          'Animals.',
          'Exam answers, graded work or anything that breaks academic integrity.',
          'Adult content, or personal data about other people.',
          'Event tickets above their original price.',
          'Scam or phishing links, asking for payment in advance, or using someone else’s account.',
        ],
      },
      {
        title: 'Be respectful',
        body: 'No insults, harassment or discrimination in listings or chats. Keep messages about the deal.',
      },
      {
        title: 'What happens if rules are broken',
        body: 'Anyone can report a listing or a student. A listing reported by several students is hidden until we review it. We can remove listings and suspend or delete accounts that break these rules.',
      },
      {
        title: 'Contact',
        body: 'Questions or a problem with another student? Write to centralemarket.contact@gmail.com.',
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro:
      'CentraleMarket is an independent project made by CentraleSupélec students. We collect only what the marketplace needs to work.',
    updated: 'October 2026',
    sections: [
      {
        title: 'What we store',
        points: [
          'Your @student-cs.fr email address, to sign you in.',
          'Your display name and, if you add one, your profile photo.',
          'Your listings and their photos.',
          'Your chat messages and your favourite items.',
        ],
      },
      {
        title: 'Who can see it',
        points: [
          'Signed-in students see your name, photo and listings.',
          'Messages are visible only to the two people in the conversation.',
          'Your favourites and your email address are visible only to you.',
          'People without a student account cannot see anything.',
        ],
      },
      {
        title: 'Who helps us run the app',
        body: 'Data is stored by Supabase on servers in the European Union, and the app is served by Vercel. We do not sell your data and there are no ads.',
      },
      {
        title: 'Cookies and storage',
        body: 'We only use your browser storage to keep you signed in and to remember your preferences (like your language). No advertising or tracking cookies.',
      },
      {
        title: 'Statistics and errors',
        body: 'We count visits anonymously with Vercel Web Analytics, without cookies. If the app breaks on your device, we record what failed and on which screen (no messages or personal content) to fix it, and delete it after 60 days.',
      },
      {
        title: 'How long we keep it',
        body: 'Until you delete your account. You can do it at any time from Profile → Delete account: your profile, listings, photos, favourites and chats are deleted for good.',
      },
      {
        title: 'Your rights',
        body: 'Under the GDPR you can access, correct and delete your data. Most of it you can edit directly in the app; deleting your account removes everything.',
      },
      {
        title: 'Contact',
        body: 'For any question or request about your data, write to centralemarket.contact@gmail.com. You can also file a complaint with the CNIL (cnil.fr).',
      },
    ],
  },
}
