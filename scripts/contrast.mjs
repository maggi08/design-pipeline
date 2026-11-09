#!/usr/bin/env node
/**
 * WCAG contrast of the token pairs a design repo promises, in every theme tokens.css defines.
 *
 *   node contrast.mjs [<tokens.css>] [--json]
 *
 * The pairs come from the `@contrast` line in tokens.css: `@contrast --foreground/--background --primary-foreground/--primary:large`.
 * A pair passes at 4.5:1, a `:large` pair at 3:1. Themes: the bare `:root` block, then any `:root` block inside
 * `@media (prefers-color-scheme: dark)` or under `[data-theme="dark"]`, layered over the light values.
 * Colours: #rgb, #rrggbb, #rrggbbaa (alpha ignored), rgb()/rgba(), and var(--x) chains. Anything else is reported
 * as unresolved, not guessed. Exit 1 on a failing or unresolved pair, or no @contrast line. Node 22, no dependencies.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const json = args.includes('--json')
const file = resolve(args.find((a) => !a.startsWith('--')) ?? 'tokens.css')
if (!existsSync(file)) {
  console.error(`contrast: ${file} not found`)
  process.exit(1)
}
const css = readFileSync(file, 'utf8')

const pairs = [...(css.match(/@contrast\s+([^*\n]+)/)?.[1] ?? '').matchAll(/(--[\w-]+)\/(--[\w-]+)(:large)?/g)].map((m) => ({ fg: m[1], bg: m[2], large: Boolean(m[3]) }))

/** Custom properties of every block whose selector matches, in source order. */
function declarations(source, selectorTest) {
  const out = {}
  for (const m of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectorTest(m[1].trim())) continue
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) out[d[1]] = d[2].trim()
  }
  return out
}

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
const clean = stripComments(css)
const darkMedia = [...clean.matchAll(/@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{([\s\S]*?\})\s*\}/g)].map((m) => m[1]).join('\n')
const outside = clean.replace(/@media[^{]*\{[\s\S]*?\}\s*\}/g, '')

const light = declarations(outside, (sel) => sel === ':root')
const darkOwn = { ...declarations(darkMedia, (sel) => /^:root\b/.test(sel)), ...declarations(outside, (sel) => /\[data-theme=["']?dark["']?\]/.test(sel)) }
const themes = [['light', light]]
if (Object.keys(darkOwn).length) themes.push(['dark', { ...light, ...darkOwn }])

function rgbOf(value, vars, depth = 0) {
  if (!value || depth > 8) return null
  const v = value.trim()
  const ref = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/)
  if (ref) return rgbOf(vars[ref[1]] ?? ref[2], vars, depth + 1)
  let m = v.match(/^#([0-9a-f]{3,8})$/i)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join('')
    if (h.length !== 6 && h.length !== 8) return null
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  if (m) return m.slice(1, 4).map(Number)
  return null
}

const lum = ([r, g, b]) => {
  const f = (c) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const results = []
for (const [theme, vars] of themes) {
  for (const { fg, bg, large } of pairs) {
    const a = rgbOf(vars[fg], vars)
    const b = rgbOf(vars[bg], vars)
    const need = large ? 3 : 4.5
    if (!a || !b) {
      results.push({ theme, pair: `${fg}/${bg}`, ok: false, why: `unresolved ${!a ? `${fg} = ${vars[fg] ?? 'undefined'}` : `${bg} = ${vars[bg] ?? 'undefined'}`}` })
      continue
    }
    const r = Math.round(ratio(a, b) * 100) / 100
    results.push({ theme, pair: `${fg}/${bg}`, ratio: r, need, ok: r >= need })
  }
}

const failed = results.filter((r) => !r.ok)
if (json) console.log(JSON.stringify({ file, pairs: pairs.length, themes: themes.map(([t]) => t), results }, null, 2))
else {
  if (!pairs.length) console.log('contrast: no @contrast line in tokens.css — list the text/background pairs to keep at AA')
  else console.log(`contrast: ${pairs.length} pair(s) × ${themes.length} theme(s), ${failed.length} failing`)
  for (const r of results) console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.theme.padEnd(5)} ${r.pair.padEnd(42)} ${r.ratio ? `${r.ratio}:1 (need ${r.need})` : r.why}`)
}
process.exit(failed.length || !pairs.length ? 1 : 0)
