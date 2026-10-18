// OpenCode V2 entry for the Agentic Workflow plugin.
//
// The same directory is a Claude Code plugin (.claude-plugin/plugin.json) and an
// OpenCode package plugin (package.json → this file). Nothing here is a second
// copy of the workflow: commands, skills and agents are read from the shared
// markdown at load, and the guard hooks run the same hooks/hooks.json commands
// with CLAUDE_PLUGIN_ROOT pointed at this package.
//
// Mapping (Claude Code → OpenCode V2):
//   commands/*.md            → ctx.command.transform (prompt = command body)
//   skills/*/SKILL.md        → ctx.skill.transform
//   agents/*.md              → ~/.config/opencode/agents/agentic-workflow-<role>.md
//                              (AgentEditor has no add; agents load from files)
//   UserPromptSubmit hooks   → ctx.session.hook("prompt"), stdout appended
//   PreToolUse Bash/Read     → ctx.permission.hook("evaluate"), exit 2 → deny
//   PostToolUse Write|Edit   → ctx.tool.hook("execute.after"), advisory only
// Not mapped (no V2 equivalent): Stop, SessionStart, SessionEnd.

import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
export const PREFIX = "agentic-workflow"
const OWNED = "# managed-by: agentic-workflow (opencode sync) — edits are overwritten"

// Minimal frontmatter split: `key: value` lines only (all this plugin uses).
export function parseMarkdown(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: text }
  const data = {}
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (kv) data[kv[1]] = kv[2].trim()
  }
  return { data, body: m[2] }
}

const read = (p) => readFileSync(p, "utf8")
const mdFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [])

// The shared markdown names Claude Code spellings; one preamble translates them.
export const RUNTIME_NOTE = [
  "<runtime-note>",
  "You are running the Agentic Workflow inside OpenCode, not Claude Code.",
  `- \`/${PREFIX}:<cmd>\` is the OpenCode command \`/${PREFIX}:<cmd>\`.`,
  `- The agent \`${PREFIX}:<role>\` is the OpenCode subagent \`${PREFIX}-<role>\`; spawn it with the \`subagent\` tool where the text says "spawn" or "Agent tool".`,
  `- \`\${CLAUDE_PLUGIN_ROOT}\` is \`${ROOT}\`.`,
  "- Claude-only tools (AskUserQuestion, Artifact, Monitor) are absent: ask the user in plain text instead.",
  "</runtime-note>",
].join("\n")

// Claude Code appends `ARGUMENTS: …` when a command body has no $ARGUMENTS slot.
export function expand(body, args = "") {
  const out = body.replaceAll("${CLAUDE_PLUGIN_ROOT}", ROOT)
  if (out.includes("$ARGUMENTS")) return out.replaceAll("$ARGUMENTS", args)
  return args ? `${out}\n\nARGUMENTS: ${args}` : out
}

export function loadCommands() {
  return mdFiles(join(ROOT, "commands")).map((f) => {
    const { data, body } = parseMarkdown(read(join(ROOT, "commands", f)))
    return { name: `${PREFIX}:${basename(f, ".md")}`, description: data.description, body }
  })
}

export function loadSkills() {
  const dir = join(ROOT, "skills")
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((d) => existsSync(join(dir, d, "SKILL.md")))
    .sort()
    .map((d) => {
      const path = join(dir, d, "SKILL.md")
      const { data, body } = parseMarkdown(read(path))
      return { id: `${PREFIX}:${data.name || d}`, name: data.name || d, description: data.description, path, content: expand(body) }
    })
}

// Claude agent frontmatter → OpenCode agent file. `model` is dropped (Claude
// aliases like `opus` are not OpenCode provider/model refs — the agent inherits
// the session model); `tools` has no 1:1 field, so it stays in the prompt text.
export function renderAgent(text) {
  const { data, body } = parseMarkdown(text)
  const desc = String(data.description || "").replaceAll('"', '\\"')
  const tools = data.tools ? `\nTools this role expects (Claude Code names): ${data.tools}.\n` : ""
  return `---\ndescription: "${desc}"\nmode: subagent\n---\n${OWNED}\n${RUNTIME_NOTE}\n${tools}\n${expand(body)}`
}

// Writes only files this plugin owns (OWNED marker); a user's own file of the
// same name is left alone. Returns the names written.
export function syncAgents(target) {
  mkdirSync(target, { recursive: true })
  const written = []
  for (const f of mdFiles(join(ROOT, "agents"))) {
    const out = join(target, `${PREFIX}-${f}`)
    if (existsSync(out) && !read(out).includes(OWNED)) continue
    const next = renderAgent(read(join(ROOT, "agents", f)))
    if (!existsSync(out) || read(out) !== next) writeFileSync(out, next)
    written.push(basename(out, ".md"))
  }
  return written
}

// hooks.json entries for one Claude event, filtered by tool matcher.
export function hookCommands(event, tool) {
  const cfg = JSON.parse(read(join(ROOT, "hooks", "hooks.json")))
  return (cfg.hooks[event] || [])
    .filter((g) => !tool || new RegExp(`^(${g.matcher || ".*"})$`).test(tool))
    .flatMap((g) => g.hooks.filter((h) => h.type === "command"))
}

export function runHook(hook, payload, cwd) {
  const r = spawnSync("bash", ["-c", hook.command], {
    cwd,
    input: JSON.stringify(payload),
    encoding: "utf8",
    timeout: (hook.timeout || 10) * 1000,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT, AGENTIC_WORKFLOW_RUNTIME: "opencode" },
  })
  return { code: r.status ?? 0, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() }
}

// OpenCode tool/permission ids → the Claude tool names hooks.json matches on.
const CLAUDE_TOOL = { shell: "Bash", bash: "Bash", read: "Read", write: "Write", edit: "Edit", patch: "Edit" }

export function claudeInput(tool, input = {}) {
  if (tool === "Bash") return { command: input.command ?? input.cmd ?? "" }
  return { file_path: input.filePath ?? input.file_path ?? input.path ?? "" }
}

// Runs the PreToolUse guards; returns the first block (exit 2) or null.
export function preToolBlock(tool, toolInput, cwd) {
  for (const h of hookCommands("PreToolUse", tool)) {
    const r = runHook(h, { hook_event_name: "PreToolUse", tool_name: tool, tool_input: toolInput, cwd }, cwd)
    if (r.code === 2) return r.stderr || r.stdout || `${PREFIX} guard blocked this ${tool} call`
  }
  return null
}

export default {
  id: PREFIX,
  async setup(ctx) {
    const cwd = ctx.location?.directory || process.cwd()
    const opts = ctx.options || {}

    await ctx.command.transform((editor) => {
      for (const c of loadCommands()) {
        editor.add({
          name: c.name,
          description: c.description,
          execute: async ({ sessionID, prompt, delivery }) => {
            const args = prompt?.text || ""
            await ctx.session.prompt({
              ...prompt,
              sessionID,
              text: `${RUNTIME_NOTE}\n\n${expand(c.body, args)}`,
              delivery,
            })
          },
        })
      }
    })

    const skills = loadSkills()
    await ctx.skill.transform((editor) => {
      for (const s of skills) editor.get(s.id) ? editor.update(s.id, (x) => Object.assign(x, s)) : editor.add(s)
    })

    if (opts.agents !== false) {
      const target = opts.agentsDir || join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode", "agents")
      syncAgents(target)
      await ctx.agent.reload()
    }

    // UserPromptSubmit: Claude injects hook stdout as context; here it is
    // appended to the admitted prompt. Exit 2 cannot reject (no V2 API).
    await ctx.session.hook("prompt", (event) => {
      const text = event.prompt.text || ""
      const notes = []
      for (const h of hookCommands("UserPromptSubmit")) {
        const r = runHook(h, { hook_event_name: "UserPromptSubmit", prompt: text, session_id: event.sessionID, cwd }, cwd)
        if (r.stdout) notes.push(r.stdout)
      }
      if (notes.length) event.prompt.text = `${text}\n\n<system-reminder>\n${notes.join("\n")}\n</system-reminder>`
    })

    // PreToolUse: blocking guards (push to default branch, merge/publish
    // guards). Permission evaluation is V2's typed deny path.
    await ctx.permission.hook("evaluate", (event) => {
      const tool = CLAUDE_TOOL[event.action]
      if (!tool || (tool !== "Bash" && tool !== "Read")) return
      const raw = event.metadata?.input || (tool === "Bash" ? { command: event.resources?.[0] } : { filePath: event.resources?.[0] })
      const why = preToolBlock(tool, claudeInput(tool, raw), cwd)
      if (why) {
        event.effect = "deny"
        event.message = why
      }
    })

    // PostToolUse Write|Edit hooks are advisory reminders; run them for parity.
    await ctx.tool.hook("execute.after", (event) => {
      const tool = CLAUDE_TOOL[event.tool]
      if (event.status !== "completed" || (tool !== "Write" && tool !== "Edit")) return
      for (const h of hookCommands("PostToolUse", tool))
        runHook(h, { hook_event_name: "PostToolUse", tool_name: tool, tool_input: claudeInput(tool, event.input), cwd }, cwd)
    })
  },
}
