#!/usr/bin/env node
/**
 * The mechanical half of the design repo contract (references/prototype-contract.md): what stage-pipeline's
 * proto-spec and proto-compare need to read a prototype without guessing.
 *
 *   node proto-lint.mjs [<design repo>] [--json]
 *
 * Errors (exit 1): SPEC.md missing or without its "Files" / "Screen registry" tables; a screen in a flow file that the
 * registry lacks, or a registry row whose screen is not in its file; a flow file on disk that the Files table lacks, or
 * a Files row whose file is missing; a § named in the tables without its `## §<n>` heading; a duplicate screen id;
 * lorem ipsum; a theme or variant class on <html>/<body>.
 * Warnings (exit 0): a raw colour in a flow file's own CSS; an unpinned or non-allowed external script; tokens.css not
 * linked; a screen without any registry "Shows" text; an empty data-screen element.
 * Node 22, no dependencies.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const json = args.includes('--json')
const root = resolve(args.find((a) => !a.startsWith('--')) ?? '.')
const errors = []
const warnings = []
const err = (where, msg) => errors.push(`${where}: ${msg}`)
const warn = (where, msg) => warnings.push(`${where}: ${msg}`)

const read = (rel) => {
  const abs = join(root, rel)
  if (!existsSync(abs) || !statSync(abs).isFile()) return null
  return readFileSync(abs, 'utf8')
}

/** A markdown table under a `## <heading>` → rows of cells, header removed. */
function table(md, heading) {
  const lines = md.split('\n')
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${heading}\\s*$`, 'i').test(l))
  if (start === -1) return null
  const rows = []
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break
    if (!line.trim().startsWith('|')) continue
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/^`|`$/g, ''))
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
    rows.push(cells)
  }
  return rows.slice(1)
}

const sectionNo = (cell) => cell.match(/§\s*(\d+)/)?.[1] ?? null

const spec = read('SPEC.md')
const flowFiles = existsSync(root) ? readdirSync(root).filter((f) => /^flow-[\w-]+\.html$/.test(f)).sort() : []

if (spec === null) err('SPEC.md', 'missing — proto-spec has no behaviour source')
const files = spec === null ? [] : table(spec, 'Files')
const registry = spec === null ? [] : table(spec, 'Screen registry')
if (spec !== null && files === null) err('SPEC.md', 'no "## Files" table')
if (spec !== null && registry === null) err('SPEC.md', 'no "## Screen registry" table')

const headings = new Set(
  (spec ?? '')
    .split('\n')
    .map((l) => l.match(/^##\s+§\s*(\d+)\b/)?.[1])
    .filter(Boolean),
)

// Files table ↔ disk
const listed = new Set()
for (const [file, , section] of files ?? []) {
  if (!file) continue
  listed.add(file)
  if (read(file) === null) err('SPEC.md › Files', `${file} is listed but missing`)
  const n = sectionNo(section ?? '')
  if (n && !headings.has(n)) err('SPEC.md › Files', `${file} points to §${n}, which has no "## §${n}" heading`)
}
for (const file of flowFiles) if (!listed.has(file)) err(file, 'not in the SPEC.md Files table')

// Screens in HTML
const screensByFile = new Map()
const seen = new Map()
for (const file of flowFiles) {
  const html = read(file) ?? ''
  const ids = []
  for (const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const attrs = m[2]
    if (!/\sdata-screen(?:[\s=>]|$)/i.test(` ${attrs}`)) continue
    const id = attrs.match(/\bid\s*=\s*"([^"]+)"/i)?.[1]
    if (!id) {
      err(file, `a data-screen <${m[1]}> without an id — it cannot be deep-linked or registered`)
      continue
    }
    ids.push(id)
    if (seen.has(id)) err(file, `screen id "${id}" also used in ${seen.get(id)}`)
    else seen.set(id, file)
    const after = html.slice(m.index + m[0].length)
    const body = after.slice(0, after.search(new RegExp(`</${m[1]}>`, 'i')))
    if (!body.replace(/<!--[\s\S]*?-->/g, '').trim()) warn(file, `screen "${id}" is empty`)
  }
  screensByFile.set(file, new Set(ids))

  if (/lorem ipsum|dolor sit amet/i.test(html)) err(file, 'lorem ipsum — use the client\'s words or marked examples')
  const rootTags = [...html.matchAll(/<(html|body)\b([^>]*)>/gi)]
  for (const [, tag, attrs] of rootTags) {
    const cls = attrs.match(/\bclass\s*=\s*"([^"]*)"/i)?.[1]?.trim()
    if (cls) err(file, `<${tag} class="${cls}"> — one rendered variant: no theme or variant classes on the root (proto-spec reads the base rules)`)
  }
  if (!/href\s*=\s*"(?:\.\/)?tokens\.css"/i.test(html)) warn(file, 'does not link tokens.css')
  for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*"([^"]+)"/gi)) {
    if (!/^https?:/i.test(src)) continue
    const host = new URL(src).hostname
    if (!['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'].includes(host)) warn(file, `script from ${host} — allowed: cdn.jsdelivr.net, cdnjs.cloudflare.com, unpkg.com`)
    else if (!/@\d+\.\d+\.\d+|\/\d+\.\d+\.\d+\//.test(src)) warn(file, `script ${src} is not pinned to an exact version`)
  }
  const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  const raw = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/#[0-9a-f]{3,8}\b|\brgba?\(\s*\d/gi)].length
  if (raw) warn(file, `${raw} raw colour value(s) in the flow CSS — use var(--…) from tokens.css`)
}

// Registry ↔ HTML
const registered = new Set()
for (const [id, file, section, shows] of registry ?? []) {
  if (!id) continue
  registered.add(id)
  if (!screensByFile.has(file)) {
    err('SPEC.md › Screen registry', `${id}: file ${file || '(empty)'} is not a flow file on disk`)
    continue
  }
  if (!screensByFile.get(file).has(id)) err('SPEC.md › Screen registry', `${id} is registered in ${file} but the file has no element with id="${id}" data-screen`)
  const n = sectionNo(section ?? '')
  if (!n) err('SPEC.md › Screen registry', `${id}: no § in the Section column`)
  else if (!headings.has(n)) err('SPEC.md › Screen registry', `${id} points to §${n}, which has no "## §${n}" heading`)
  if (!shows) warn('SPEC.md › Screen registry', `${id}: the "Shows" column is empty`)
}
for (const [file, ids] of screensByFile) for (const id of ids) if (!registered.has(id)) err(file, `screen "${id}" is not in the SPEC.md screen registry`)

if (read('tokens.css') === null) warn('tokens.css', 'missing — run /design-system first')

const screens = [...screensByFile.values()].reduce((n, s) => n + s.size, 0)
if (json) {
  console.log(JSON.stringify({ root, flows: flowFiles.length, screens, errors, warnings }, null, 2))
} else {
  console.log(`proto-lint: ${flowFiles.length} flow file(s), ${screens} screen(s), ${errors.length} error(s), ${warnings.length} warning(s)`)
  for (const e of errors) console.log(`  error  ${e}`)
  for (const w of warnings) console.log(`  warn   ${w}`)
}
process.exit(errors.length ? 1 : 0)
