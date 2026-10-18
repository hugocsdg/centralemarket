---
target: intro /welcome
total_score: 20
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/huguettontet/Proyectos/centralemarket/src/pages/IntroPage.tsx"
target_fingerprint: "sha256:3c98c217fb4801d6e0a881a8395a4fd2754de7082eb6bf4335ae473cf088a771"
target_path: /Users/huguettontet/Proyectos/centralemarket/src/pages/IntroPage.tsx
timestamp: 2026-10-18T17-38-30Z
slug: src-pages-intropage-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | Chapter rail on desktop; no position cue on mobile across 23 vh |
| 2 | Match real world | 3 | Right campus vocabulary; English-only for a largely French audience |
| 3 | User control | 3 | Skip intro exists; long pins trap scrolling |
| 4 | Consistency | 3 | How-it-works told 3-4 times in different visual languages |
| 5 | Error prevention | 3 | Little to get wrong |
| 6 | Recognition | 3 | Log in hidden in the mobile header (only in footer) |
| 7 | Flexibility | n/a | Linear landing page |
| 8 | Aesthetic & minimalist | 2 | Repetition, too many sections |
| 9 | Error recovery | n/a | No forms |
| 10 | Help | n/a | Landing page |
| Total | | 20/28 (71%) | Good |

## Design specificity
~60% category template (particle hero, gradient headline, marquee, bento, stats band, giant wordmark), ~40% authored (3D campus, @student-cs.fr phone story, WhatsApp vs order, year timeline, Campus Storage). Detector: 1 CLI finding (gradient-text, IntroPage.tsx:434); browser overlay 51 desktop / 44 mobile: gradient-text x7, btn-primary contrast 4.1-4.3:1, tiny text x29 in PhoneStory, icon-tile-stack x4, kicker-above-heading x4, oversized h1, dark glow. GOALS 1.3:1 is a scroll-reveal false positive.

## Priority issues
- [P1] Length: 22,641 px = 25.2 vh desktop, 19,038 px = 23.4 vh mobile; MacBook scene alone 8.4 vh. Cut to ~10-12 vh. (/impeccable distill, layout)
- [P1] Mobile hero: h1 starts at y=391/812, top half is loose particles. (/impeccable adapt)
- [P1] Stock photography; desk/lamp frame soft and mis-cropped on mobile. Replace with generated art in one world. (/impeccable bolder)
- [P2] Stats band talks about the site; counts render 0 first. Fold 0 € + verified into hero proof, prepare real social proof slot. (/impeccable clarify)
- [P2] 3D campus is a generic grid, not the real campus. Rebuild from OSM. (/impeccable overdrive)
- [P2] btn-primary white text 4.1-4.3:1 on small labels. (/impeccable polish)

## Persona red flags
Jordan: understands the idea in 5 s, waits 13 vh for how it works. Riley: no Log in on mobile header. Casey: half-screen of dots, pinned scenes. French student: idioms, no FR toggle.

## Questions
If a student saw only 3 screens, which 3? What if every image were the Saclay plateau? Is English-only deliberate?
