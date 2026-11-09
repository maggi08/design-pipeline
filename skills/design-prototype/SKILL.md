---
name: design-prototype
description: Draws one flow of the project as a clickable HTML prototype with no logic — every screen and state in flow-<name>.html on the project's tokens, built with the surface's voice skill (Impeccable for apps, taste-skill for landing pages, Emil's skills for motion) — and writes its SPEC.md section and screen registry rows. Use after the design system is signed, to mock up a page, screen or flow, or to redo a mockup after feedback. RU triggers — «нарисуй макет экрана», «html-прототип флоу», «сверстай макет лендинга без логики»
---

# Design prototype — one flow, every state, clickable

A prototype here is the design deliverable: what the client approves and what stage-pipeline's proto-spec reads as "our Figma". It is drawn in HTML and CSS on the project's tokens, it clicks between screens, and it computes nothing.

The file rules: `${CLAUDE_PLUGIN_ROOT}/references/prototype-contract.md`. The tool for the surface: `${CLAUDE_PLUGIN_ROOT}/references/routing.md`. The starting file: `${CLAUDE_PLUGIN_ROOT}/templates/flow.html`.

## 0. Preconditions

- `STATUS.md`: Brief and System signed off. Otherwise stop and name the missing command.
- The flow is in the brief and in `STATUS.md` → Flows. A new flow is a brief change: add it there first, with the user's yes.
- Read `PRODUCT.md`, `DESIGN.md`, `tokens.css`, the flow's `BRIEF.md` rows and its `SPEC.md` section. Read `index.html` and one existing flow file if there are any, so the shell and components repeat exactly.

## 1. Shape before drawing

Write the plan for the flow as a short list in the chat, not in a file: screens in order, the states of each, the one primary action per screen, what data each shows, where the user comes from and goes next. With Impeccable installed on an Operate or Read surface, `/impeccable shape <flow>` does this step. Ask the user only what the brief does not answer; everything else is decided and stated.

## 2. Draw with the surface's voice

- **Operate** (CRM, admin, dashboard): Impeccable craft, mode Operate. Components modelled on the target kit's metrics from DESIGN.md → Components (shadcn/ui by default): tables with sticky headers and right-aligned tabular numbers, forms with inline errors, filters as chips, empty states with the next action. Charts as inline SVG drawn to scale, following the chart rules recorded at the system phase; name the Bklit UI chart that replaces it in SPEC.md.
- **Persuade** (landing, site): taste-skill. One idea per section, the client's real proof (photos, numbers, reviews they gave), never invented testimonials. Where a section copies a Kokonut UI pattern, name the component in SPEC.md so the app installs it instead of redrawing.
- **Motion**: only where `find-animation-opportunities` or the brief says it helps; build it with `animate` / `choreograph` rules, in CSS or Motion (pinned UMD, global `Motion`); anime.js only for SVG morphs, path drawing or long timelines. Respect `prefers-reduced-motion`.
- **Mobile**: draw at 390 px first; `apple-design` and `mobile-native` rules for touch targets, safe areas and native patterns.
- A third-party skill's default never beats DESIGN.md: if its taste conflicts with a token or a rule there, the token wins and the conflict is mentioned to the user in one line.

## 3. The file

Start from `templates/flow.html` (copy, rename to `flow-<flow>.html`):
- every screen and every state is its own `<section id="<screen-id>" data-screen>`, ids from the brief;
- content is real: the client's words, the brief's example data (marked as examples there), the right currency and date formats;
- styles use `var(--…)` from `tokens.css` only; a needed value that is not a token goes to DESIGN.md first;
- navigation between screens is links and `:target` or a few lines of JS; nothing is computed, stored or validated;
- the prototype's own navigation is `data-proto-chrome`;
- one rendered variant: no theme or variant classes on `<html>` / `<body>`; an alternative goes into its own file;
- add the flow to `index.html` (the hub: one link per flow, each with its screens).

## 4. SPEC.md

For the flow's `## §<n>` section: states, transitions, the CTA table (button, when enabled, does), guards and timings, data shown with formats and sort, the components the app should use (kit names), open questions. Add the Files row and one registry row per screen. HTML and SPEC.md must say the same CTA labels and states.

## 5. Check once, show, iterate

1. `node ${CLAUDE_PLUGIN_ROOT}/scripts/proto-lint.mjs <design repo>` — fix every error. `node ${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs <design repo>/tokens.css` if tokens changed.
2. One look at the rendered flow at desktop and phone width (a browser tool or an artifact preview, whichever this session has); fix what it shows in one pass.
3. Show the user: publish the flow (or the hub) as an artifact when the session can, else give the file path. Ask for feedback with the question tool (looks right; change these things; show an alternative).
4. Feedback → edit → lint → show again. A change to tokens or components goes into DESIGN.md first and then into every flow that uses it.

Write `STATUS.md` → the flow: "draft", and a journal line. Next command: `/design-review <flow>`.

## Rules

- No logic, no backend, no framework: the app is built later by stage-pipeline.
- Draw every state the brief lists. A missing empty or error state becomes a developer's guess.
- No lorem ipsum, no "Title", no fake reviews or logos. Missing content is drawn as an obvious placeholder block and listed under the brief's missing content.
