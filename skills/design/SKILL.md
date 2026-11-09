---
name: design
description: Entry point of the design pipeline for a client or side project without a designer — reads STATUS.md of the design repo, says which phase it is in (brief, system, prototypes, review, handoff) and the next command, or starts a new project. Also answers a one-off design job (animate this, critique that landing page, pick a chart) by naming the one tool to use. Use when the user starts a new order, asks where the design work stands, or what to do next with the mockups. RU triggers — «новый заказ, с чего начать дизайн», «где мы по дизайну», «что дальше с макетами»
---

# Design — where we are and what is next

The design pipeline turns an order (a landing page, a CRM, an app) into clickable HTML prototypes that stage-pipeline then builds from. It is for someone who does not design for a living: the pipeline asks, proposes and shows; the user decides.

```
/design-doctor     once per machine: are Impeccable, ui-ux-pro-max, taste-skill, Emil's skills installed
/design-brief      interview + brainstorm → BRIEF.md, PRODUCT.md, flow list        sign-off
/design-system     2–3 rendered directions → the user picks → DESIGN.md + tokens.css  sign-off
/design-prototype  one flow at a time → flow-<name>.html + SPEC.md section           per flow
/design-review     clean-context review of a flow → checks/ report + findings outcome  per flow
/design-handoff    contract check → HANDOFF.md + the pipeline.config lines for the app repo
then in the app repo: /pipeline-init → /feature-checker → /stage-plan (stage-pipeline)
```

The files and their rules: `${CLAUDE_PLUGIN_ROOT}/references/prototype-contract.md`. Which third-party skill does what: `${CLAUDE_PLUGIN_ROOT}/references/routing.md`.

## What to do when called

1. **Find the design repo.** The current directory if it has `STATUS.md`; else a sibling `*-design/` with one; else ask the user for the path, or offer to start a new project. Never create a design repo inside an app repo: the app reads it as an external `design_source`.
2. **No design repo → a new project.** Ask for the project's short name (latin, kebab-case) and where to put it (default: next to the user's other projects), then run `/design-brief`, which creates the repo from the templates. Say in one line that `/design-doctor` should run first if it never ran on this machine.
3. **Design repo found → status.** Read `STATUS.md` (phases, surfaces, flows) and print, in the user's language:
   - the phase table as it stands;
   - flows by state (not started / draft / reviewed / signed off) with their review report;
   - open items: unanswered brief questions, findings without an outcome (from `checks/`), a flow edited after its review;
   - **one next action** with its command. Order: brief not signed → `/design-brief`; no signed DESIGN.md → `/design-system`; a flow in draft → `/design-review <flow>`; a flow not started → `/design-prototype <flow>`; all flows signed off → `/design-handoff`.
4. **A one-off job, no project.** "Make this hero move nicer", "is this landing page any good", "what chart for payroll": look the job up in `${CLAUDE_PLUGIN_ROOT}/references/routing.md` → "Job → tool", name the tool in one line and run it. A project's `DESIGN.md`, if there is one in the repo, still wins over the tool's defaults.

## Gates

- No prototype before the brief and the system are signed off in `STATUS.md`. A prototype on an unsigned system gets redrawn.
- A flow is signed off only after `/design-review` with every critical and major finding resolved, and after the user saw it.
- No handoff while `scripts/proto-lint.mjs` reports errors.
- Sign-off is the user's word in this conversation, written into `STATUS.md` with the date. Silence is not sign-off.

## Talking to the user

Plain words, no design jargon without a picture: show a rendered option instead of asking "which type scale". Every question goes through the structured question tool with a recommended option first. Report in two or three lines and the next command.
