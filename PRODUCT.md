# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students of CentraleSupélec on the Paris-Saclay campus, and only them: French students, international students, Erasmus and exchange students, double-degree and Master's students. Not the other schools of the Saclay plateau. Every student both buys and sells. Two moments matter most: arriving (furnishing a room fast and cheaply) and leaving (emptying a room before a flight home, end of year or end of Erasmus).

Many users are French; the interface is in English today. Adding French is an open decision (see Capabilities and Constraints).

## Product Purpose

A second-hand marketplace (Vinted/Wallapop style) reserved for the CentraleSupélec community: publish an item with photos, browse and filter, chat inside the app, meet on campus to hand it over. It exists because student buying and selling today happens in noisy WhatsApp groups where offers get lost. Success: students use it instead of those groups, and things stay in use instead of being thrown away when people leave.

## Positioning

Only verified CentraleSupélec students can join: sign-in is a passwordless email code restricted to `@student-cs.fr` addresses, enforced in the database too. Everyone you deal with is from your school and lives or studies a few minutes away, so the handover happens on campus with no shipping. Selling and buying are free, with 0 € commission, permanently.

## Operating Context

- Campus: CentraleSupélec, Paris-Saclay (Gif-sur-Yvette plateau): Bâtiment Eiffel, Bouygues, Bréguet, the student residences I–VI managed by César, the Complexe sportif du Moulon.
- Handover happens in person on campus; payment is arranged between students (the app does not process payments).
- Contact happens only through the in-app chat. The founders explicitly do not want WhatsApp contact.
- Built by two students (one an Erasmus student from Barcelona); an independent student initiative, not an official school service.

## Capabilities and Constraints

- Working: email-code login (`@student-cs.fr` only), publishing with photos, explore/search/filter, item detail, edit, reserved/sold states, delete, real-time chat with unread counter, animated intro at `/welcome` (shown without a session and once per device).
- Stack: Vite + React 19 + TypeScript, Tailwind v4, React Router, Supabase (Auth, Postgres with RLS, Storage, Realtime), deployed on Vercel.
- Not built yet: email notifications for new chat messages, a professional email sender and own domain, privacy/rules page and a "Report" button, Favorites (currently "Coming soon").
- Campus Storage (leaving furniture in campus storage and selling from home) is an idea only; it depends on school permission and must be presented as not available.
- Open decision: French + English with a language switcher (to be agreed before building).

## Brand Commitments

- Name: CentraleMarket. Original logo by the founders in `public/logo-mark.png` and `public/logo-full.png`.
- Voice: short, clear sentences with personality; no corporate filler or generic AI phrasing.
- The "Everything gets lost in WhatsApp" versus "Everything in order" contrast is a confirmed hook.
- The four-step story is confirmed: student email → publish → chat → meet on campus.
- The intro keeps "Skip intro", "Log in" and "Get started".

## Evidence on Hand

- Pre-launch: no real users yet beyond the founders. There are no real user counts and no testimonials. Do not invent either; any social-proof slot stays hidden until the founders provide real data.
- Real product facts usable as proof: verified-students-only sign-in, 0 € commission, in-app chat, campus handover.
- Campus geography: OpenStreetMap data (requires the "© OpenStreetMap contributors" credit) and the founders' reference photos (Apple Maps capture, César residences plan).

## Product Principles

1. Trust comes from the school: the verified `@student-cs.fr` community is the core promise, so never blur it with the wider plateau.
2. Order over noise: every surface should feel calmer and clearer than a WhatsApp group.
3. Campus is the place: the physical campus and the in-person handover are part of the product, not decoration.
4. Free and honest: no fees, no fabricated proof, and ideas that are not built are labelled as such.

## Accessibility & Inclusion

Already applied across the site and to be kept: grey text at least `text-white/60` (placeholders `/50`), nothing below 11px, tap targets at least 44px, a visible red focus ring for keyboard users, `aria-label` on search fields and icon-only buttons, lazy-loaded offscreen images, and full respect for `prefers-reduced-motion` (no animation, still images).
