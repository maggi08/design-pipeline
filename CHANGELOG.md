# Changelog — design-pipeline

## 0.1.0

First version: design before code for side projects without a designer. A repository of its own; the `magzhan` marketplace in claude-pipeline lists it by tag.

- Seven skills: `/design` (status and next step, or the one tool for a one-off job), `/design-brief` (interview, brainstorm, surfaces and flows, sign-off), `/design-system` (ui-ux-pro-max once, two or three directions rendered as the product's own screen, DESIGN.md + tokens.css), `/design-prototype` (one flow as clickable HTML with every state, SPEC.md section and registry), `/design-review` (orchestrates the review and the findings outcome), `/design-handoff` (HANDOFF.md and the stage-pipeline config lines), `/design-doctor` (what is installed; manual).
- One agent: `design-review`, the clean-context checker of a flow.
- Third-party skills are dependencies, not copies: Impeccable and ui-ux-pro-max required, taste-skill and Emil Kowalski's skills optional; `references/routing.md` picks one voice skill per surface by its mode.
- The design repo contract (`references/prototype-contract.md`) matches what stage-pipeline's `proto-spec` and `proto-compare` read: SPEC.md with a Files table, a screen registry and § sections; screens as `id` + `data-screen`; one rendered variant; prototype chrome marked `data-proto-chrome`.
- Scripts, Node 22 without dependencies: `proto-lint.mjs` (the contract), `contrast.mjs` (WCAG pairs from the `@contrast` line, light and dark), `doctor.mjs` (installed tools, the paths of search.py and Impeccable's launcher).
- Templates: STATUS.md, BRIEF.md, SPEC.md, tokens.css (shadcn token names), flow.html.
- `scripts/validate.mjs` (manifest, frontmatter, the checker's tool list, `${CLAUDE_PLUGIN_ROOT}` links, Cyrillic, README counts, ticket ids) and `scripts/test.mjs` (fixture design repos for proto-lint, contrast and doctor) run in the `validate` workflow; a push to `main` tags `v<version>`.
