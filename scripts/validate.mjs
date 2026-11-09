#!/usr/bin/env node
/**
 * Repo checks for the design-pipeline plugin. Free, no model calls, no dependencies; CI runs it on every push.
 *
 *   node scripts/validate.mjs
 *
 * - the manifest has a name, a version and a description; the top CHANGELOG section equals the version;
 * - every skill: SKILL.md, name = folder, a description, at most 30 KB;
 * - every agent: name = file, a description, a `tools:` line from the allowed set (a checker reads, runs the lint scripts
 *   and writes its report; it never edits with Edit, never spawns agents, never fetches);
 * - every `${CLAUDE_PLUGIN_ROOT}/…` link leads to a file that exists; no links into the author's own skills folder in markdown;
 * - Cyrillic only in a description line, after the label " RU triggers — ";
 * - the "N skills / N agents" count in README.md matches the tree;
 * - no ticket-shaped ids (ABC-123) in the plugin text.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)
const rel = (abs) => relative(ROOT, abs).split('\\').join('/')

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
  } catch (e) {
    fail(path, `does not parse — ${e.message}`)
    return null
  }
}

const frontmatter = (abs) => {
  const lines = readFileSync(abs, 'utf8').split('\n')
  if (lines[0].trim() !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return null
  const fields = {}
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([a-zA-Z-]+):\s*(.*)$/)
    if (m) fields[m[1]] = m[2].trim()
  }
  return fields
}

const walk = (dir, keep) =>
  readdirSync(dir).flatMap((name) => {
    if (['.git', 'node_modules', '.github'].includes(name)) return []
    const abs = join(dir, name)
    return statSync(abs).isDirectory() ? walk(abs, keep) : keep(name) ? [abs] : []
  })

// manifest + CHANGELOG
const manifest = readJson('.claude-plugin/plugin.json')
if (manifest) {
  for (const key of ['name', 'version', 'description']) if (!manifest[key]) fail('.claude-plugin/plugin.json', `no ${key}`)
  const top = existsSync(join(ROOT, 'CHANGELOG.md')) ? readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8').match(/^## (\d+\.\d+\.\d+)/m)?.[1] : null
  if (top !== manifest.version) fail('CHANGELOG.md', `the top section is ${top ?? 'missing'}, plugin.json has ${manifest.version}`)
}

// skills
const skillsDir = join(ROOT, 'skills')
const skills = readdirSync(skillsDir).filter((n) => statSync(join(skillsDir, n)).isDirectory())
for (const name of skills) {
  const abs = join(skillsDir, name, 'SKILL.md')
  const where = `skills/${name}/SKILL.md`
  if (!existsSync(abs)) {
    fail(where, 'skill without SKILL.md')
    continue
  }
  const fm = frontmatter(abs)
  if (!fm) fail(where, 'no frontmatter')
  else if (fm.name !== name) fail(where, `name "${fm.name}" does not match the folder "${name}"`)
  else if (!fm.description) fail(where, 'no description — the skill cannot be found by it')
  const kb = statSync(abs).size / 1024
  if (kb > 30) fail(where, `${kb.toFixed(1)} KB over the 30 KB budget — move detail to references/`)
}

// agents
const ALLOWED_TOOLS = new Set(['read', 'grep', 'glob', 'bash', 'write'])
const agentsDir = join(ROOT, 'agents')
const agents = existsSync(agentsDir) ? readdirSync(agentsDir).filter((f) => f.endsWith('.md')) : []
for (const file of agents) {
  const where = `agents/${file}`
  const fm = frontmatter(join(agentsDir, file))
  if (!fm) {
    fail(where, 'no frontmatter')
    continue
  }
  if (fm.name !== file.replace(/\.md$/, '')) fail(where, `name "${fm.name}" does not match the file name`)
  if (!fm.description) fail(where, 'no description')
  const tools = (fm.tools ?? '').replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean)
  if (!tools.length) fail(where, 'no tools line — without it the agent gets every tool')
  for (const tool of tools) if (!ALLOWED_TOOLS.has(tool.split('(')[0].trim().toLowerCase())) fail(where, `tool ${tool} is not allowed for a checker (Read, Grep, Glob, Bash, Write)`)
}

// text checks over everything shipped
const textFiles = walk(ROOT, (name) => /\.(md|mjs|html|css|json)$/.test(name))
for (const abs of textFiles) {
  const where = rel(abs)
  readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
    for (const [, path] of line.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+)/g)) {
      const clean = path.replace(/[.,]+$/, '')
      if (!existsSync(join(ROOT, clean))) fail(`${where}:${i + 1}`, `link to a missing \${CLAUDE_PLUGIN_ROOT}/${clean}`)
    }
    if (where.endsWith('.md') && /~\/\.claude\/(skills|agents)/.test(line)) fail(`${where}:${i + 1}`, 'link to ~/.claude — use ${CLAUDE_PLUGIN_ROOT}')
    if (/[\u0400-\u04FF]/.test(line) && !/^description:[^\u0400-\u04FF]* RU triggers — /.test(line)) fail(`${where}:${i + 1}`, 'Cyrillic outside a description\'s RU triggers tail — the plugin is English')
    const ticket = line.match(/\b(?!AC-|SHA-|ISO-|RFC-|WCAG-|UTF-|HTTP-)[A-Z]{2,6}-\d{3,5}\b/)
    if (ticket && !where.startsWith('scripts/validate')) fail(`${where}:${i + 1}`, `ticket id «${ticket[0]}» — no project identifiers in the plugin`)
  })
}

// README counts
const readme = existsSync(join(ROOT, 'README.md')) ? readFileSync(join(ROOT, 'README.md'), 'utf8') : ''
const realSkills = skills.filter((n) => existsSync(join(skillsDir, n, 'SKILL.md'))).length
readme.split('\n').forEach((line, i) => {
  for (const [word, actual] of [['skill', realSkills], ['agent', agents.length]]) {
    const m = line.match(new RegExp(`(?<![\\d.]|[Ss]teps?\\s|[Ss]tages?\\s)(\\d+) ${word}s?(?![\\w-])(?=\\s*$|[,.;:)(|*/—·+&]|\\s(?:and|plus)\\s)`))
    if (m && Number(m[1]) !== actual) fail(`README.md:${i + 1}`, `says «${m[0]}», the plugin has ${actual}`)
  }
})

if (errors.length) {
  console.error(`validate: ${errors.length} error(s)`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`validate: ok — ${realSkills} skills, ${agents.length} agent(s), ${textFiles.length} files checked`)
