---
name: design-review
description: Reviews a drawn prototype flow in a clean context before the client sees it — contract lint, contrast, Impeccable's slop detector, a critique against PRODUCT.md and DESIGN.md, every brief state present, motion reviewed with Emil's rules — and writes a checks/ report with severities, then records the outcome of every finding. Use when a flow is drawn and before sign-off, or when the user asks whether a mockup is good enough. RU triggers — «проверь макет», «ревью прототипа», «готов ли макет показать клиенту»
---

# Design review — a fresh pair of eyes on a flow

The one who drew a flow is the worst judge of it. The review runs as the `design-review` agent in a clean context: it reads the design repo, checks, and writes a report. It fixes nothing.

## Orchestrator: run it

1. The flow is in `STATUS.md` with state "draft" (or "reviewed" and edited since). Read its file name and screen ids from `SPEC.md`.
2. Spawn the `design-review` agent with: the design repo path, the flow file, the report path `checks/design-review-<flow>.md` (a re-review: `-r<k>.md`), the language from `STATUS.md`, and the surface mode and voice skill from `BRIEF.md`. Nothing else: the agent reads the sources itself.
3. When it returns, fix what is confirmed (in DESIGN.md first when a token or component is the cause), then re-run the review for the fixed findings only — at most two fix rounds.
4. Append `## Findings outcome` to the report: one line per critical and major finding, in the stage-pipeline outcome form (`fixed: <file:line or how rechecked>`, `false: <proof>`, `user decision <date or quote>`). "Leaving it", "later", "the client won't notice" are not outcomes.
5. Show the user the flow and the short result. On their yes: `STATUS.md` → the flow "signed off <date>", the review report in its row.

## The checks (the agent's methodology)

Severity is only critical, major or minor:
- **critical** — the flow cannot be implemented or shown as is: a contract error proto-spec would trip on, a brief flow or state missing, text unreadable (contrast below 3:1), a fabricated testimonial, logo or client claim.
- **major** — a real user or the client would notice: AA contrast below 4.5:1 on body text, a screen without its primary action, a token-less value that breaks consistency, an inconsistent component between screens, a detector hit from the "AI tells" family, broken phone layout, a CTA label differing from SPEC.md.
- **minor** — polish: spacing rhythm, a weak empty state copy, a heading that wraps badly.

1. **Contract**: `node ${CLAUDE_PLUGIN_ROOT}/scripts/proto-lint.mjs <repo>`. Every error is critical, every warning minor unless it is a raw colour that differs from all tokens (major).
2. **Contrast**: `node ${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs <repo>/tokens.css`, plus any text the flow puts on a colour that is not in the `@contrast` list (compute it).
3. **Detector**: Impeccable's launcher (`impeccable_bin:` from `node ${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs`) — `"<impeccable_bin>" detect --json <flow file>`; exit 2 means findings. Each finding with its rule id. Not installed → "Could not verify: detector".
4. **Brief coverage**: every screen and state the brief lists for this flow exists; every screen has one primary action; the content is real (no lorem, no invented proof).
5. **System fidelity**: type sizes, weights, radii, spacing and components match DESIGN.md; one rendered variant; the same component looks the same on every screen.
6. **Critique by mode**: Operate — scanability, summary before detail, state visible at a glance (badges, not colour alone), tables aligned, dense but calm. Persuade — one idea per section, the first screen states the offer and the action, proof is real and specific, the page reads on a phone. Read — measure 65–75ch, headings carry the structure.
7. **Motion** (when the flow moves): Emil's `review-animations` rules — purpose, duration 150–300 ms for UI, easing, no layout thrash, `prefers-reduced-motion` respected. The skill's file is found by doctor; not installed → apply the four rules here and say so.
8. **Responsive**: the flow at 390 px and 1440 px — no horizontal page scroll, wide tables scroll inside their container, touch targets ≥ 44 px on phone screens. A browser tool when the session has one; else a static read of the CSS, named under "Could not verify".

## The report

```markdown
# Design review — <flow>
Findings: critical N · major N · minor N
flow: flow-<flow>.html · design repo: <path> · mode: <mode>

## Findings
- C-1 critical — <screen-id>: <problem> — expected <value from DESIGN.md/BRIEF/SPEC>, found <value> (`flow-<flow>.html:<line>`)
- M-1 major — …
- m-1 minor — …

## Matches
<one line: what was checked and holds>

## Could not verify
<what and why; "everything verified" when empty>
```

The `Findings:` line is the second line, in the English form for an `en` repo; a `ru` repo uses the same skeleton with Russian text. Every finding names its screen id and a `file:line`.
