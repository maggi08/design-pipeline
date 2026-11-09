#!/usr/bin/env node
/**
 * What design-pipeline routes to, and whether it is installed on this machine. Read-only.
 *
 *   node doctor.mjs [--json]
 *
 * Plugins are read from ~/.claude/plugins/installed_plugins.json; standalone skills (Emil Kowalski's) from
 * ~/.claude/skills, <cwd>/.claude/skills and ~/.agents/skills. It also resolves the two executables the skills call:
 * ui-ux-pro-max's search.py and Impeccable's launcher, printed as `uupm_search:` and `impeccable_bin:` lines.
 * Exit 1 when a required tool is missing; optional ones only print an install hint. Node 22, no dependencies.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const json = process.argv.includes('--json')
const HOME = process.env.HOME || homedir()
const pluginsJson = join(HOME, '.claude/plugins/installed_plugins.json')

let installed = []
try {
  const data = JSON.parse(readFileSync(pluginsJson, 'utf8'))
  installed = Object.keys(data.plugins ?? data ?? {})
} catch {
  // no file — nothing installed through the plugin system, or another layout; reported per tool below
}
const hasPlugin = (name) => installed.some((key) => key === name || key.startsWith(`${name}@`))

const skillRoots = [join(HOME, '.claude/skills'), join(process.cwd(), '.claude/skills'), join(HOME, '.agents/skills')]
const skillAt = (name) => skillRoots.map((dir) => join(dir, name, 'SKILL.md')).find((p) => existsSync(p)) ?? null

/** First file named `file` whose path contains every part, depth-limited, under `dir`. */
function find(dir, file, parts, depth = 7) {
  if (depth < 0 || !existsSync(dir)) return null
  let entries = []
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isFile() && e.name === file && parts.every((x) => p.includes(x))) return p
  }
  for (const e of entries.filter((x) => x.isDirectory() && !['node_modules', '.git', 'data', 'gallery', 'screenshots'].includes(x.name)).sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }))) {
    const hit = find(join(dir, e.name), file, parts, depth - 1)
    if (hit) return hit
  }
  return null
}

const cache = join(HOME, '.claude/plugins/cache')
const uupmSearch = find(cache, 'search.py', ['ui-ux-pro-max', '/scripts/']) ?? skillRoots.map((d) => join(d, 'ui-ux-pro-max/scripts/search.py')).find((p) => existsSync(p)) ?? null
const impeccableBin = find(cache, 'impeccable', ['impeccable', '/skills/impeccable/scripts/']) ?? skillRoots.map((d) => join(d, 'impeccable/scripts/impeccable')).find((p) => existsSync(p)) ?? null

const EMIL = ['animate', 'choreograph', 'review-animations', 'improve-animations', 'find-animation-opportunities', 'remove-animations', 'prototype', 'pick-ui-library', 'apple-design', 'mobile-native', 'animate-expo', 'gestures']
const emilFound = EMIL.filter((s) => skillAt(s))

const which = (bin) => {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const checks = [
  {
    name: 'Impeccable', role: 'voice of Operate/Read surfaces, audit, critique, detector', required: true,
    ok: hasPlugin('impeccable') || Boolean(skillAt('impeccable')),
    install: 'claude plugin marketplace add pbakaus/impeccable && claude plugin install impeccable@impeccable',
  },
  {
    name: 'ui-ux-pro-max', role: 'one-time design-system generation (/design-system)', required: true,
    ok: Boolean(uupmSearch),
    install: 'claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill && claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill',
  },
  {
    name: 'taste-skill', role: 'voice of Persuade surfaces (landing pages, sites)', required: false,
    ok: hasPlugin('taste-skill') || Boolean(skillAt('taste-skill')),
    install: 'claude plugin marketplace add Leonxlnx/taste-skill && claude plugin install taste-skill@taste-skill',
  },
  {
    name: 'Emil Kowalski skills', role: `motion, mobile, prototypes (${emilFound.length}/${EMIL.length} found)`, required: false,
    ok: emilFound.length === EMIL.length,
    install: 'npx skills@latest add emilkowalski/skills   (pick the global scope)',
    missing: EMIL.filter((s) => !emilFound.includes(s)),
  },
  { name: 'python3', role: 'runs ui-ux-pro-max search.py', required: true, ok: which('python3'), install: 'install Python 3' },
  { name: 'node', role: 'runs proto-lint / contrast', required: true, ok: which('node'), install: 'install Node 22+' },
]

const missingRequired = checks.filter((c) => c.required && !c.ok)
if (json) {
  console.log(JSON.stringify({ checks, uupm_search: uupmSearch, impeccable_bin: impeccableBin, pluginsJson: existsSync(pluginsJson) ? pluginsJson : null }, null, 2))
} else {
  for (const c of checks) {
    console.log(`${c.ok ? 'ok     ' : c.required ? 'MISSING' : 'missing'} ${c.name} — ${c.role}`)
    if (!c.ok) console.log(`        install: ${c.install}${c.missing?.length ? `\n        not found: ${c.missing.join(', ')}` : ''}`)
  }
  console.log(`uupm_search: ${uupmSearch ?? 'not found'}`)
  console.log(`impeccable_bin: ${impeccableBin ?? 'not found'}`)
  if (!existsSync(pluginsJson)) console.log(`note: ${pluginsJson} not found — plugin checks fell back to skill folders`)
}
process.exit(missingRequired.length ? 1 : 0)
