# design-pipeline

Design before code, for side projects without a designer: an order (a landing page, a CRM, an app) goes through an interview, a design system, clickable HTML prototypes and a review, and comes out as a design repo that [stage-pipeline](https://github.com/maggi08/claude-pipeline/tree/main/plugins/stage-pipeline) builds from.

The plugin owns the process and the files. The taste comes from third-party skills it routes to, one voice per surface.

## Installation

The plugin is listed in the `magzhan` marketplace of [claude-pipeline](https://github.com/maggi08/claude-pipeline), pinned to a version tag:

```bash
claude plugin marketplace add maggi08/claude-pipeline
claude plugin install design-pipeline@magzhan
```

The tools it routes to install from their own marketplaces (the doctor prints these commands too):

```bash
# required
claude plugin marketplace add pbakaus/impeccable && claude plugin install impeccable@impeccable
claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill && claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill
# optional
claude plugin marketplace add Leonxlnx/taste-skill && claude plugin install taste-skill@taste-skill
npx skills@latest add emilkowalski/skills
```

Restart Claude Code, then run `/design-doctor`. The plugin has 7 skills and 1 agent.

## The flow

| Step | Command | Output | Gate |
|---|---|---|---|
| 0 | `/design-doctor` | which tools are installed | once per machine |
| 1 | `/design-brief` | BRIEF.md, PRODUCT.md, flows and screen ids | user sign-off |
| 2 | `/design-system` | directions rendered as the product's screen → DESIGN.md, tokens.css | user sign-off, contrast passes |
| 3 | `/design-prototype <flow>` | flow-<flow>.html with every state, SPEC.md section | proto-lint clean |
| 4 | `/design-review <flow>` | checks/design-review-<flow>.md + findings outcome | no open critical/major, user sign-off |
| 5 | `/design-handoff` | HANDOFF.md, the app repo's pipeline.config lines | all v1 flows signed off |

`/design` at any point says where the project stands and the next command.

After the handoff, the app repo runs stage-pipeline as usual (`/pipeline-init` → `/feature-checker` → `/stage-plan`), with `proto-spec` and `proto-compare` reading the design repo instead of Figma.

## Which tool for which job

The full table is [references/routing.md](references/routing.md). In short:

| Surface | Voice | Also |
|---|---|---|
| App, CRM, dashboard (Operate) | Impeccable | shadcn/ui metrics, Bklit UI charts in the app |
| Landing page, site (Persuade) | taste-skill | Kokonut UI blocks in the app, Motion |
| Motion anywhere | Emil's `animate`, `choreograph`, `review-animations` | Motion; anime.js for SVG and timelines |
| Mobile | Impeccable + `apple-design`, `mobile-native` | `animate-expo`, `gestures` |
| A system from nothing | ui-ux-pro-max, once | curated, never used as is |

Not used: Manus (a general agent), GSAP, Kokonut UI on app screens.

## The design repo

One project, one repository, next to the app repo: STATUS.md, BRIEF.md, PRODUCT.md, DESIGN.md, tokens.css, SPEC.md, README.md, index.html, flow-*.html, assets/, directions/, checks/. The rules, and why each exists for proto-spec: [references/prototype-contract.md](references/prototype-contract.md).

## Scripts

- `scripts/proto-lint.mjs [<repo>] [--json]` — the contract: SPEC.md tables ↔ flow files ↔ screen ids, § headings, one rendered variant, no lorem ipsum; warnings for raw colours and unpinned scripts.
- `scripts/contrast.mjs [<tokens.css>] [--json]` — WCAG AA for every pair on the `@contrast` line, in light and dark.
- `scripts/doctor.mjs [--json]` — installed tools and the paths of ui-ux-pro-max's `search.py` and Impeccable's launcher.

## Language

The plugin is written in English. A design repo's files follow `Language:` in its STATUS.md (`ru` or `en`); the chat follows the user.

## Development

```bash
node scripts/validate.mjs   # manifest, frontmatter, links, Cyrillic, README counts
node scripts/test.mjs       # fixture design repos for proto-lint, contrast and doctor
```

CI runs both on every push and pull request. A release: raise `version` in `.claude-plugin/plugin.json`, add the `## <version>` section on top of `CHANGELOG.md`, merge into `main` — CI creates the tag `v<version>`; then raise `ref` of the `design-pipeline` entry in claude-pipeline's `.claude-plugin/marketplace.json`.

To try a change before a release: push a branch, then in a local clone of claude-pipeline set the entry's `ref` to that branch and run `claude plugin update design-pipeline`. Do not merge that `ref` into claude-pipeline's `main`.
