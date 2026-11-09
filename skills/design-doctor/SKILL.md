---
name: design-doctor
description: Checks that the tools the design pipeline routes to are installed on this machine — Impeccable, ui-ux-pro-max, taste-skill, Emil Kowalski's motion and mobile skills, python3 and node — and prints the exact install command for each missing one. Use once per machine, after a new laptop, or when a design command says a tool is missing. RU triggers — «проверь дизайн-инструменты», «что установить для дизайн-пайплайна»
disable-model-invocation: true
---

# Design doctor — what is installed

Run:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs
```

Read its output to the user as a short table: tool, what it is for in the pipeline, installed or not, and for a missing one the install command exactly as printed. Required tools missing (Impeccable, ui-ux-pro-max, python3, node) block `/design-system` and `/design-review`; optional ones (taste-skill, Emil's skills) only narrow the routing: a Persuade surface without taste-skill is drawn with Impeccable, motion without Emil's skills follows the rules written in `/design-review`.

Installing is the user's action: do not run the install commands yourself. After an install, Claude Code needs a restart; then run the doctor again.

The two paths it prints, `uupm_search:` and `impeccable_bin:`, are what `/design-system` and `/design-review` call. If one says "not found" while the tool is installed, the plugin cache layout changed: ask the user where the tool lives and use that path for this session.

Impeccable's own design hook (it scans every UI edit) is installed by `npx impeccable install` in a project. In a design repo it is useful; say so once, and let the user decide.
