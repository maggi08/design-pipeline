# The design repo contract

One client project = one design repo (`<project>-design/`, its own git repository). stage-pipeline reads it as a file-based design source: its `proto-spec` agent pulls a stage spec from it and `proto-compare` checks the app code against it. Everything below exists so that those two agents read the prototype the way it was meant, without guessing.

`scripts/proto-lint.mjs` checks the mechanical part of this contract.

## Layout

```
<project>-design/
  STATUS.md          phases, sign-offs, flow table, review reports — the pipeline's journal
  BRIEF.md           the interview result: order, audience, surfaces, flows, content, open questions
  PRODUCT.md         product truth in Impeccable's schema (Impeccable commands read it)
  DESIGN.md          the visual system in Impeccable's DESIGN.md format (tokens in the frontmatter)
  tokens.css         the same tokens as CSS custom properties, plus the @contrast line
  SPEC.md            behaviour: file table, screen registry, one § section per flow
  README.md          what changed and why, newest first (proto-spec reads it for rationale)
  index.html         the hub: links to every flow, the only page with free-form chrome
  flow-<name>.html   one file per flow, every screen and state inside it
  assets/            images, icons, fonts the prototypes use
  directions/        the design-system directions and the raw ui-ux-pro-max output (history, not normative)
  checks/            design-review reports
```

## Screens

- A screen is an element with both `id` and `data-screen`: `<section id="orders-empty" data-screen>`. The id is the deep link (`flow-orders.html#orders-empty`) and the key of the screen registry.
- Every state is its own screen: `orders-list`, `orders-empty`, `orders-loading`, `orders-error`. A state hidden behind a JS flag is invisible to proto-spec.
- Screen ids are lowercase kebab-case, unique across the repo, and never reused for another screen. Renaming one is a SPEC.md change and a README line.
- The content is real: the client's words, plausible names and numbers marked as examples in the brief. No lorem ipsum, no "Title here".

## One rendered variant

- A flow file renders one design. No theme or variant classes on `<html>` / `<body>`, no toggle between two looks: proto-spec reads the base rules, and a baked-in override class has already produced a wrong implementation once.
- Light and dark are tokens: `tokens.css` defines both, dark under `@media (prefers-color-scheme: dark)`. A prototype that commits to one theme says so in DESIGN.md.
- An alternative layout lives in its own file (`flow-orders-b.html`) and SPEC.md says which one is current.

## Prototype chrome

Navigation between screens, a state switcher, a "this is a prototype" note: everything that is not the product is marked `data-proto-chrome` on its root element. proto-compare ignores it; the app must not implement it.

## Behaviour, not logic

A prototype clicks: links and buttons move between screens, a drawer opens, a tab switches. It does not compute, store, validate or fetch. What the app must do lives in SPEC.md, not in JS.

## SPEC.md

Three fixed parts, in this order, then one section per flow.

```markdown
# <Project> — prototype spec

## Files
| File | CSS | Section |
|---|---|---|
| flow-orders.html | tokens.css, flow-orders.css | §2 Orders |

## Screen registry
| Screen id | File | Section | Shows |
|---|---|---|---|
| orders-list | flow-orders.html | §2 | the month's orders, newest first |
| orders-empty | flow-orders.html | §2 | no orders yet, CTA "Add first order" |

## §1 Global
Navigation, shell, language switch, formats (money, dates), shared components.

## §2 Orders
- States: list → empty, loading, error (which screen ids).
- Transitions: what moves where on which action.
- CTA table: | Button | When enabled | Does |
- Guards and timings: what blocks an action, how long a toast stays.
- Data shown: fields, formats, sort order, limits.
- Open questions: what the client has not decided.
```

- Every screen in a flow file is in the registry, and every registry row exists in its file.
- Every flow file on disk is in the Files table; every § named in the tables exists as a heading `## §<n> <name>`.
- A divergence between HTML and SPEC.md (a CTA label, a missing state) is a defect of the design repo, not a choice for the developer.

## Tokens

- `tokens.css` is the single source of colour, type, radius, spacing and shadow values; flow CSS uses `var(--…)` only. A raw hex in a flow file is a lint warning.
- The names follow the target app's theme when it is known (shadcn: `--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, `--ring`, `--chart-1…5`), so the handoff copies them without a mapping table.
- The `@contrast` comment lists the text/background pairs `scripts/contrast.mjs` must keep at WCAG AA: `/* @contrast --foreground/--background --muted-foreground/--card --primary-foreground/--primary */`. A pair suffixed `:large` needs 3:1.

## External resources

Fonts from Google Fonts; scripts from cdn.jsdelivr.net, cdnjs.cloudflare.com or unpkg.com, each pinned to an exact version. Images live in `assets/`. A prototype must open from the file system.
