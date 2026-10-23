// Runs the WebGPU skill's test prompts through Claude Code and records which
// skill loaded, which files were read, the answer, and the estimated cost.
// Grading against reviews/webgpu/tasks.md is done by a person afterwards.
//
//   node reviews/webgpu/evals/run.mjs [--model claude-opus-5-5] [--only T1-with,S8] [--jobs 4]
//
// Each prompt runs in a fresh temp folder with project-only settings, no MCP
// servers, auto-memory off, and read-only tools. "with" runs get a copy of
// the skill in .claude/skills/webgpu. Spend lands on the signed-in Claude
// account, capped per prompt by --max-budget-usd. The last full run of 32
// prompts cost about $3 on Opus.

import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const skill = join(here, '../../../skills/webgpu')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : fallback
}
const model = arg('--model', 'claude-opus-5-5')
const only = arg('--only', '')?.split(',').filter(Boolean)
const parallel = Number(arg('--jobs', '4'))

const { tasks, selection } = JSON.parse(readFileSync(join(here, 'prompts.json'), 'utf8'))
let jobs = [
  ...tasks.flatMap((t) => [
    { id: `${t.id}-with`, prompt: t.prompt, fixture: t.fixture, withSkill: true, budget: 1 },
    { id: `${t.id}-without`, prompt: t.prompt, fixture: t.fixture, withSkill: false, budget: 1 },
  ]),
  ...selection.map((s) => ({ id: s.id, prompt: s.prompt, withSkill: true, budget: 0.4, shouldLoad: s.shouldLoad })),
]
if (only.length) jobs = jobs.filter((j) => only.includes(j.id))

const outDir = mkdtempSync(join(tmpdir(), `webgpu-evals-${model}-`))
console.log(`model ${model}, ${jobs.length} prompts, results in ${outDir}`)

function runOne(job) {
  const cwd = join(outDir, 'runs', job.id)
  mkdirSync(cwd, { recursive: true })
  if (job.fixture) cpSync(join(here, job.fixture), cwd, { recursive: true })
  if (job.withSkill) cpSync(skill, join(cwd, '.claude/skills/webgpu'), { recursive: true })

  const args = ['-p', job.prompt, '--settings', '{"autoMemoryEnabled": false}', '--setting-sources', 'project',
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--tools', 'Read,Glob,Grep,Skill',
    '--permission-mode', 'dontAsk', '--max-budget-usd', String(job.budget), '--no-session-persistence',
    '--output-format', 'stream-json', '--verbose', '--model', model]
  const started = Date.now()

  return new Promise((resolve) => {
    const child = spawn('claude', args, { cwd })
    let raw = ''
    child.stdout.on('data', (d) => (raw += d))
    const timer = setTimeout(() => child.kill(), 300_000)
    child.on('close', () => {
      clearTimeout(timer)
      writeFileSync(join(outDir, `${job.id}.jsonl`), raw)
      const rec = { run: job.id, model, status: 'no result', skills: [], reads: [], cost: null, output: null }
      for (const line of raw.split('\n')) {
        let d
        try { d = JSON.parse(line) } catch { continue }
        for (const c of d.type === 'assistant' ? d.message?.content ?? [] : []) {
          if (c.type !== 'tool_use') continue
          if (c.name === 'Skill') rec.skills.push(c.input.skill)
          if (c.name === 'Read') rec.reads.push(String(c.input.file_path).split(`/runs/${job.id}/`).pop())
        }
        if (d.type === 'result') Object.assign(rec, { status: d.subtype, cost: d.total_cost_usd, output: d.result })
      }
      rec.seconds = Math.round((Date.now() - started) / 1000)
      if (job.shouldLoad !== undefined) rec.selectionCorrect = rec.skills.includes('webgpu') === job.shouldLoad
      console.log(job.id, rec.status, JSON.stringify(rec.skills), `$${rec.cost?.toFixed(3)}`)
      resolve(rec)
    })
  })
}

const results = []
const queue = [...jobs]
await Promise.all(Array.from({ length: parallel }, async () => {
  while (queue.length) results.push(await runOne(queue.shift()))
}))
results.sort((a, b) => a.run.localeCompare(b.run, 'en', { numeric: true }))
writeFileSync(join(outDir, 'results.json'), JSON.stringify(results, null, 1) + '\n')

const sel = results.filter((r) => r.selectionCorrect !== undefined)
const cost = results.reduce((n, r) => n + (r.cost ?? 0), 0)
console.log(`selection correct: ${sel.filter((r) => r.selectionCorrect).length}/${sel.length}`)
console.log(`estimated cost: $${cost.toFixed(2)}`)
console.log(`results: ${join(outDir, 'results.json')}`)
