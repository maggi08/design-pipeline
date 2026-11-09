---
name: design-system
description: Builds the project's visual system once — runs ui-ux-pro-max on the signed brief, curates two or three directions, renders them as real screens of this product so a non-designer can choose, then writes DESIGN.md and tokens.css and checks contrast. Use after the brief is signed, when a project has no brand, or to redo colours, fonts and spacing for a project. RU triggers — «подбери цвета и шрифты», «дизайн-система для проекта», «варианты стиля»
---

# Design system — directions, a choice, tokens

A non-designer cannot pick a palette from swatches. So the directions are shown as the product's own main screen, drawn two or three ways, and the user picks the one they would hand the client.

Inputs: the signed `BRIEF.md` and `PRODUCT.md`. Outputs: `DESIGN.md` (Impeccable's DESIGN.md format, tokens in the frontmatter), `tokens.css` (from `${CLAUDE_PLUGIN_ROOT}/templates/tokens.css`), `directions/` (history).

## 0. Preconditions

- `STATUS.md` → Brief is signed off. If not, stop and name `/design-brief`.
- Brand assets in the brief (a logo, colours, fonts) are binding: they are extracted into the system, not replaced. With a full brand the job is `/impeccable document` plus tokens, not a search; skip to step 3 with the brand as the only direction.
- Find ui-ux-pro-max: `node ${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs` prints `uupm_search: <path>`. Not found → tell the user once and continue with Impeccable's own new-work direction instead of the search.

## 1. Search

Run the search once per surface mode, with words from the brief, not generic ones (`"<business> <audience> <mood>"`), and dials by mode:

```bash
python3 "<uupm_search>" "<query>" --design-system -p "<Project>" --density <8 Operate | 4 Persuade> --variance <3 Operate | 6 Persuade> --motion <2 Operate | 5 Persuade> -f markdown
python3 "<uupm_search>" "<business type>" --domain color -n 5
python3 "<uupm_search>" "<mood words>" --domain typography -n 5
python3 "<uupm_search>" "<what the charts compare>" --domain chart -n 3      # Operate surfaces with numbers
```

Save every output to `directions/raw.md`, headed with the query. It is history, never normative.

## 2. Curate two or three directions

The tool's pick is raw material. For each direction decide palette, type, radius, density and elevation, and reject what does not fit the brief:
- **Category defaults that miss the user**: a kids' font for an adult admin because the business teaches children; a dark "tech" theme for a bakery.
- **Landing-page leftovers in an app**: hero patterns, CTA rhythm, scroll reveals belong to Persuade surfaces only.
- **Motion snippets in a library the stack does not use** (the tool prints GSAP): restate them for Motion or CSS.
- **Fonts without the brief's scripts**: Cyrillic, and for Kazakh the nine extra letters of the cyrillic-ext subset. Check the family's subsets before proposing it.
- **The common AI looks**: warm cream with a serif and terracotta; near-black with one acid accent; purple-to-blue gradients; Inter or Space Grotesk by reflex; glass and glow; cards inside cards.

Directions must differ in kind (calm ledger vs warm and rounded vs bold contrast), not in one hue.

## 3. Render the choice

Write `directions/index.html`: the product's most important screen (from the brief's flows: the CRM's main table, the landing page's first two sections), drawn once per direction side by side or as tabs, with real content from the brief. Under each: three plain-language lines (the feel, what it suits, the risk). Light and dark when the brief needs both. Show it to the user (publish as an artifact when the session can, else open the file) and ask which one with the question tool: direction A / B / C / mix (say what from which).

## 4. Write the system

- `DESIGN.md` in Impeccable's format: the YAML frontmatter (colors, typography, rounded, spacing, components) and the sections Overview (with a named North Star), Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Add a `## Surfaces` section when the project has more than one: density, motion and voice skill per surface.
- **Components** are drawn from the target kit when the brief names one (shadcn/ui by default for React): button heights, input, table row height, badge, card padding — so proto-spec later meets the same metrics in the app's kit instead of reporting a mismatch.
- `tokens.css` with the same values, token names following the target app's theme, and the `@contrast` line listing every text/background pair the screens use.
- Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs <design repo>/tokens.css`. Fix every FAIL in DESIGN.md and tokens.css together (darken the colour, never shrink the list) until it passes.
- Money, dates and numbers: write the formats into DESIGN.md (tabular numerals, the currency position, the thousands separator for the brief's locale).

## 5. Sign-off

Show the final system as one rendered page (`directions/final.html`: the same key screen plus a specimen of buttons, inputs, a table, badges, both themes). The user signs off with the question tool. Write `STATUS.md` → System: "signed off <date>, direction <name>", and add to `README.md`: what was chosen and why. Next command: `/design-prototype <first flow>`.

## Rules

- DESIGN.md is the source of truth; tokens.css follows it. A value used in a prototype that is not a token goes into DESIGN.md first.
- One system for the whole project. Surfaces differ in density and motion, not in palette or type.
- ui-ux-pro-max runs in this phase only. Later phases read DESIGN.md, not the search.
