#!/usr/bin/env node
/**
 * Fixture tests for the plugin's scripts: each check must pass a clean design repo and catch a planted defect.
 *
 *   node scripts/test.mjs
 *
 * Temporary repos only; nothing in this checkout is touched. Node 22, no dependencies.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LINT = join(ROOT, 'scripts/proto-lint.mjs')
const CONTRAST = join(ROOT, 'scripts/contrast.mjs')
let failed = 0
const check = (name, ok, out = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}`)
  if (!ok) {
    failed++
    console.log(String(out).split('\n').map((l) => `    ${l}`).join('\n'))
  }
}
const run = (script, ...args) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

const tokens = readFileSync(join(ROOT, 'templates/tokens.css'), 'utf8')
const spec = `# Demo — prototype spec

## Files
| File | CSS | Section |
|---|---|---|
| flow-orders.html | tokens.css | §2 Orders |

## Screen registry
| Screen id | File | Section | Shows |
|---|---|---|---|
| orders-list | flow-orders.html | §2 | the month's orders |
| orders-empty | flow-orders.html | §2 | no orders yet, CTA "Add first order" |

## §1 Global
- Formats: money 1 250 000 ₸

## §2 Orders
- States: orders-list → orders-empty
`
const flow = (extra = '', root = '<html lang="en">') => `<!doctype html>
${root}
<head><link rel="stylesheet" href="tokens.css"><style>body { color: var(--foreground); }</style></head>
<body>
<section id="orders-list" data-screen><h1>Orders</h1><p>Order 1042, 18 500 ₸ (example)</p></section>
<section id="orders-empty" data-screen><h1>No orders yet</h1><a href="#orders-list">Add first order</a></section>
${extra}
<nav data-proto-chrome><a href="#orders-list">list</a></nav>
</body>
</html>
`

function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), 'design-repo-'))
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), body)
  }
  return dir
}

const cases = [
  ['proto-lint: a clean repo passes', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow() }, 0, null],
  ['proto-lint: a screen missing from the registry fails', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow('<section id="orders-error" data-screen><p>Could not load orders. Retry.</p></section>') }, 1, /orders-error" is not in the SPEC\.md screen registry/],
  ['proto-lint: a registry row without its screen fails', { 'SPEC.md': spec.replace('| orders-empty |', '| orders-gone |'), 'tokens.css': tokens, 'flow-orders.html': flow() }, 1, /orders-gone is registered/],
  ['proto-lint: a flow file not in the Files table fails', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow(), 'flow-extra.html': flow().replaceAll('orders-', 'extra-') }, 1, /flow-extra\.html: not in the SPEC\.md Files table/],
  ['proto-lint: a § without its heading fails', { 'SPEC.md': spec.replace('## §2 Orders', '## Orders'), 'tokens.css': tokens, 'flow-orders.html': flow() }, 1, /no "## §2" heading/],
  ['proto-lint: lorem ipsum fails', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow().replace('No orders yet', 'Lorem ipsum') }, 1, /lorem ipsum/],
  ['proto-lint: a variant class on <html> fails', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow('', '<html lang="en" class="theme-b">') }, 1, /one rendered variant/],
  ['proto-lint: a raw colour is a warning, not an error', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow().replace('color: var(--foreground);', 'color: #123456;') }, 0, /raw colour/],
  ['proto-lint: an unpinned CDN script is a warning', { 'SPEC.md': spec, 'tokens.css': tokens, 'flow-orders.html': flow('<script src="https://cdn.jsdelivr.net/npm/motion/dist/motion.js"></script>') }, 0, /not pinned/],
  ['proto-lint: no SPEC.md fails', { 'tokens.css': tokens, 'flow-orders.html': flow() }, 1, /SPEC\.md: missing/],
]
for (const [name, files, code, pattern] of cases) {
  const dir = repo(files)
  const got = run(LINT, dir)
  check(name, got.code === code && (!pattern || pattern.test(got.out)), got.out)
  rmSync(dir, { recursive: true, force: true })
}

// contrast
{
  const dir = repo({ 'tokens.css': tokens })
  const ok = run(CONTRAST, join(dir, 'tokens.css'))
  check('contrast: the template tokens pass AA in light and dark', ok.code === 0 && /light/.test(ok.out) && /dark/.test(ok.out), ok.out)
  writeFileSync(join(dir, 'tokens.css'), tokens.replace('--muted-foreground: #64748b;', '--muted-foreground: #a0aec0;'))
  const bad = run(CONTRAST, join(dir, 'tokens.css'))
  check('contrast: a light grey muted text on white fails', bad.code === 1 && /FAIL light --muted-foreground\/--background/.test(bad.out), bad.out)
  writeFileSync(join(dir, 'tokens.css'), tokens.replace(/ \* @contrast[^\n]*\n/, ''))
  const none = run(CONTRAST, join(dir, 'tokens.css'))
  check('contrast: no @contrast line fails', none.code === 1 && /no @contrast line/.test(none.out), none.out)
  writeFileSync(join(dir, 'tokens.css'), tokens.replace('--primary: #0f172a;', '--primary: var(--foreground);'))
  const chain = run(CONTRAST, join(dir, 'tokens.css'))
  check('contrast: a var() chain is resolved', chain.code === 0, chain.out)
  rmSync(dir, { recursive: true, force: true })
}

// doctor never crashes on a machine without the tools
{
  const home = mkdtempSync(join(tmpdir(), 'doctor-home-'))
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts/doctor.mjs'), '--json'], { encoding: 'utf8', env: { ...process.env, HOME: home } })
  let parsed = null
  try {
    parsed = JSON.parse(r.stdout)
  } catch {
    // reported below
  }
  check('doctor: an empty machine reports the missing tools as JSON and exits 1', r.status === 1 && parsed?.checks?.some((c) => c.name === 'Impeccable' && !c.ok), r.stdout + r.stderr)
  rmSync(home, { recursive: true, force: true })
}

if (failed) {
  console.error(`\n${failed} failing`)
  process.exit(1)
}
console.log('\ntests: ok')
