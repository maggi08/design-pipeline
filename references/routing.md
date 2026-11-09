# Tool routing — which tool for which job

design-pipeline owns the process (phases, files, gates). The design voice comes from third-party skills that install on their own (`/design-doctor` checks them). This file decides which one speaks for a given job, so two skills with conflicting taste never shape the same surface.

## Precedence

1. The user's words in this conversation.
2. The design repo: `DESIGN.md`, then `PRODUCT.md`, then `BRIEF.md`. A third-party skill's default never overrides a token, a font or a rule written there.
3. The one voice skill routed for the surface (table below).
4. Everything else is advice: a second skill may audit, it does not restyle.

**One voice per surface.** A surface is a set of screens with one job: the marketing site, the app, the mobile app. Its voice skill is picked once, at the brief, from its mode, and recorded in `BRIEF.md` → "Surfaces". Switching the voice later is a user decision, written into `STATUS.md`.

## Surface mode → voice skill

| Mode | Typical orders | Voice skill (prototype phase) | Review add-ons |
|---|---|---|---|
| **Operate** — the visitor completes a task | CRM, admin panel, dashboard, booking back office, internal tool, settings | Impeccable (`/impeccable shape`, `/impeccable craft`, mode Operate) | `/impeccable audit`, `/impeccable harden` |
| **Persuade** — the visitor decides and acts | landing page, company site, product launch, pricing page, event page | taste-skill | `/impeccable critique`; `review-animations` when the page moves |
| **Read** — the visitor understands | docs, blog, help center, case study | Impeccable (mode Read) | `/impeccable typeset` |
| **Mobile** — the same modes on a phone app | an Expo / React Native app, a PWA that must feel native | Impeccable for layout + `apple-design`, `mobile-native` | `animate-expo`, `gestures` |

A mixed order (a landing page plus a CRM) has two surfaces and two voices, and both share one `DESIGN.md`: tokens and type are common, density and motion differ per surface and are written per surface in `DESIGN.md` → "Surfaces".

## Job → tool

| Job | Tool | Phase |
|---|---|---|
| Design system from nothing (no brand) | ui-ux-pro-max `search.py --design-system`, run once, then curated (`/design-system`) | system |
| Record or refresh an existing visual system | `/impeccable document` | system |
| Plan a screen before drawing it | `/impeccable shape` | prototype |
| A landing section or a whole marketing page | taste-skill | prototype |
| App screens: tables, forms, filters, empty states | Impeccable craft, components modelled on shadcn/ui | prototype |
| Charts in an Operate surface | chart rules from ui-ux-pro-max `--domain chart`; inline SVG in the prototype, Bklit UI in the app | prototype → app |
| Find where motion helps | `find-animation-opportunities` | prototype |
| Build a motion moment (easing, timing, sequence) | `animate`, `choreograph`; Motion (`motion` UMD) in the prototype | prototype |
| SVG morphs, path drawing, long timelines | anime.js (UMD) in the prototype | prototype |
| Review motion that exists | `review-animations`, then `improve-animations` | review |
| Remove motion that does not earn its place | `remove-animations` | review |
| Compare two or three layout ideas | `prototype` (Emil), or `/impeccable live` on a running page | prototype |
| Choose a library instead of hand-rolling | `pick-ui-library` | handoff / app |
| Marketing building blocks in the app (hero, bento, animated cards) | Kokonut UI (shadcn registry), Persuade surfaces only | app |
| Toasts | `ask-sonner` (sonner) | app |

## Not routed

- Manus: a general agent, not a design tool. Nothing here calls it.
- Kokonut UI in an Operate surface: its effects (particles, glass, shimmer) fight dense, scanned screens.
- GSAP: Motion and anime.js cover the prototype; the app stack decides its own library.
- A second voice skill on the same surface "for a second opinion": use it as a reviewer, never as a builder.

## In the HTML prototype vs in the app

The prototype is plain HTML + CSS + a little JS, so React-only libraries cannot run in it.

| Library | Prototype | App (stage-pipeline) |
|---|---|---|
| shadcn/ui | its metrics and states are copied into `DESIGN.md` → "Components" and drawn in CSS | the real components |
| Bklit UI | inline SVG drawn to the same rules | the real charts |
| Kokonut UI | the pattern is drawn by hand, the source component is named in SPEC.md | the real component |
| Motion | `https://cdn.jsdelivr.net/npm/motion@<pinned>/dist/motion.js`, global `Motion` | `motion` / `motion/react` |
| anime.js | its UMD build from cdnjs or jsdelivr, pinned | `animejs` |
| Lucide | `https://cdn.jsdelivr.net/npm/lucide@<pinned>/dist/umd/lucide.min.js` | `lucide-react` / `lucide-vue-next` |

Every library in a prototype is pinned to an exact version: an unpinned CDN link renders a different prototype next month.
