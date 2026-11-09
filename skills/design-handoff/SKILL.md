---
name: design-handoff
description: Hands the signed prototypes to development — checks the design repo contract, freezes a design commit, writes HANDOFF.md (flows, screen ids, tokens, kit components to install, open questions) and the pipeline.config.md lines that make stage-pipeline read the prototypes through proto-spec and proto-compare. Use when every flow is signed off and the app is about to be built, or when the app repo needs to point at a new design version. RU triggers — «передать макеты в разработку», «подключи прототипы к stage-pipeline», «хендофф дизайна»
---

# Design handoff — from prototypes to stage-pipeline

stage-pipeline already knows a file-based design source: in a repo whose `pipeline.config.md` declares it, `proto-spec` replaces `figma-spec` and `proto-compare` replaces `figma-compare`. The handoff makes the design repo that source and tells the app repo where it is.

## 0. Preconditions

- Every flow the brief keeps for v1 is "signed off" in `STATUS.md`, each with a review report whose critical and major findings all have an outcome. A flow left for later is marked "v2" in `STATUS.md` by the user, not skipped silently.
- `node ${CLAUDE_PLUGIN_ROOT}/scripts/proto-lint.mjs <design repo>` has no errors; `node ${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs <design repo>/tokens.css` passes.
- The design repo is committed and clean (`git -C <design repo> status --porcelain` empty). If not, ask the user to commit; the handoff records a commit, never a dirty tree.

## 1. HANDOFF.md

Write `HANDOFF.md` in the design repo:
- **Design version**: the commit sha and date. proto-compare compares against this commit and reports a later design change as a replan, not a code defect.
- **Flows**: one row per flow — file, screen ids, the SPEC.md section, the review report.
- **Tokens**: how `tokens.css` maps onto the app's theme. With shadcn names in both, "copy as is into `app/globals.css`"; otherwise a mapping table.
- **Kit components**: every component SPEC.md names (shadcn/ui components, Bklit UI charts, Kokonut UI blocks for Persuade surfaces) with its install command (`npx shadcn@latest add <name>`, the registry URL for Bklit or Kokonut). `pick-ui-library` decides any gap where SPEC.md names nothing.
- **Fonts and assets**: families with subsets, files in `assets/` the app needs.
- **Open questions**: every open question from BRIEF.md and the SPEC.md sections, with an owner.
- **Not in the prototype**: logic, data, permissions, validation — listed from SPEC.md so nobody reads their absence in the HTML as "not needed".

## 2. The app repo

Ask for the app repo path (or "not created yet"). Then give, and with the user's yes write, the lines for `<app repo>/.claude/pipeline.config.md`. If the file does not exist yet, tell the user to run `/pipeline-init` there first and paste these into it:

```markdown
## Design sources of truth
- design_source: <absolute or ../relative path to the design repo>
- spec: <design repo>/SPEC.md
- tokens: <the app's theme file, e.g. app/globals.css — filled from tokens.css>
- ui_lib: <shadcn/ui, components in components/ui/ | the project's kit>
- breakpoints: <from DESIGN.md → Layout>
- i18n: <from BRIEF.md → Content>

## Checker overrides
- figma-spec → proto-spec
- figma-compare → proto-compare
```

When the app repo is inside a different parent than the design repo, also tell the user to give stage-pipeline access to it (`--scope project --dirs <design repo>` in stage-pipeline's permissions script).

## 3. Next steps, in the app repo

Print them in order, with the commands:
1. `/pipeline-init` (if not done) and the lines above.
2. Copy the tokens into the app theme; install the kit components from HANDOFF.md.
3. `/feature-checker <first flow>` → `/stage-plan`: one stage per screen and its states; each stage's "Visual reference" is `flow-<name>.html#<screen-id>`.
4. During stages, `proto-compare` checks the code against the prototype; a design change goes through the design repo (`/design-prototype` → `/design-review` → a new HANDOFF.md commit), never as a silent code-side deviation.

Write `STATUS.md` → Handoff: "done <date>, design commit <sha>, app repo <path>".
