// ccp-ui.mjs — how `ccp` draws a `claude -p --output-format stream-json` turn.
// Two renderers behind one interface (header/text/tool/toolDone/footer):
//   plain — ANSI only, zero deps, always available (NO_COLOR / non-TTY = no styling)
//   pi    — @earendil-works/pi-tui Markdown, if `ccp setup --tui` installed it
//           into ~/.local/share/ccp; never bundled with the plugin. Any load
//           failure falls back to plain.
// Look borrowed from pi-open-tui (MIT): framed header, segment footer, boxed prompt.

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const PI_TUI = '@earendil-works/pi-tui';
export const PI_TUI_VERSION = '1.3.0';
export const tuiDir = (home = homedir()) => path.join(process.env.XDG_DATA_HOME || path.join(home, '.local', 'share'), 'ccp');

const color = (on) => {
  const w = (a, b) => (s) => (on ? `\x1b[${a}m${s}\x1b[${b}m` : String(s));
  return { dim: w(2, 22), bold: w(1, 22), cyan: w(36, 39), green: w(32, 39), red: w(31, 39), yellow: w(33, 39), mag: w(35, 39) };
};

// Model/tool-derived strings never reach the terminal raw: drop C0/C1 controls
// (ESC included) except \n and \t, so a file or reply can't inject escapes.
export const clean = (s) => String(s ?? '').replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '');

// The one argument worth showing for a tool call.
export function toolSummary(name, input = {}) {
  const v = input.command ?? input.file_path ?? input.path ?? input.pattern ?? input.url ?? input.description ?? input.prompt ?? '';
  return clean(v).replace(/\s+/g, ' ').trim();
}

const cut = (s, n) => (s.length > n ? `${s.slice(0, Math.max(0, n - 1))}…` : s);
const width = (out) => Math.min(out.columns || 80, 100);

export function plainUi({ out = process.stdout, err = process.stderr, styled = !process.env.NO_COLOR && !!out.isTTY } = {}) {
  const c = color(styled);
  let spin = null;
  const stopSpin = () => { if (spin) { clearInterval(spin); spin = null; err.write('\r\x1b[2K'); } };
  return {
    c, styled,
    renderText: (t) => t
      .replace(/^(#{1,6}) (.*)$/gm, (_, __, h) => c.bold(c.cyan(h)))
      .replace(/\*\*([^*\n]+)\*\*/g, (_, b) => c.bold(b))
      .replace(/`([^`\n]+)`/g, (_, k) => c.yellow(k)),
    header({ session, mode, model }) {
      const title = clean(` ccp · ${String(session).slice(0, 8)} · ${mode}${model ? ` · ${model}` : ''} `);
      const sub = ' headless on claude -p · Ctrl-D quit · Ctrl-C stop turn ';
      const n = Math.max(title.length, sub.length) + 2;
      out.write(`${c.dim('╭─')}${c.bold(title)}${c.dim('─'.repeat(n - title.length) + '╮')}\n`);
      out.write(`${c.dim('│')}${c.dim(sub.padEnd(n + 1))}${c.dim('│')}\n${c.dim('╰' + '─'.repeat(n + 1) + '╯')}\n`);
    },
    spinner() {
      if (!styled || !err.isTTY) return;
      const f = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'; const t0 = Date.now(); let i = 0;
      spin = setInterval(() => err.write(`\r${c.mag(f[i++ % f.length])} ${c.dim(`working ${Math.round((Date.now() - t0) / 1000)}s`)}`), 100);
    },
    stopSpin,
    text(t) { stopSpin(); out.write(`${this.renderText(t)}\n`); },
    tool(name, summary) { stopSpin(); out.write(`  ${c.cyan('⏺')} ${c.bold(name.padEnd(6))} ${c.dim(cut(summary, width(out) - name.length - 10))}\n`); },
    toolDone(ok) { if (!ok) out.write(`    ${c.red('✗ tool error')}\n`); },
    footer({ secs, tools, cost, total }) {
      stopSpin();
      const seg = [`${secs}s`, `${tools} tool${tools === 1 ? '' : 's'}`, cost != null && `$${cost.toFixed(2)}`, total != null && `total $${total.toFixed(2)}`].filter(Boolean).join(' · ');
      out.write(`${c.dim(`─ ${seg} ` + '─'.repeat(Math.max(0, width(out) - seg.length - 4)))}\n\n`);
    },
    promptText: () => `${c.green('❯')} `,
  };
}

// pi renderer: plain chrome, pi-tui Markdown for assistant text.
export function piUi(tui, opts) {
  const ui = plainUi(opts);
  const { c } = ui;
  const id = (s) => s;
  const theme = { heading: (s) => c.bold(c.cyan(s)), link: c.cyan, linkUrl: c.dim, code: c.yellow, codeBlock: id, codeBlockBorder: c.dim,
    quote: c.dim, quoteBorder: c.dim, hr: c.dim, listBullet: c.cyan, bold: c.bold, italic: id, strikethrough: id, underline: id };
  const out = opts?.out || process.stdout;
  ui.renderText = (t) => new tui.Markdown(t, 0, 0, theme).render(width(out)).map((l) => l.trimEnd()).join('\n');
  ui.kind = 'pi';
  return ui;
}

// Import pi-tui from ccp's own folder by absolute path; null when absent or broken.
export async function loadPiTui(dir = tuiDir()) {
  try {
    const pkg = path.join(dir, 'node_modules', ...PI_TUI.split('/'));
    if (!existsSync(path.join(pkg, 'package.json'))) return null;
    const main = JSON.parse(readFileSync(path.join(pkg, 'package.json'), 'utf8')).main || 'dist/index.js';
    const mod = await import(pathToFileURL(path.join(pkg, main)).href);
    return typeof mod.Markdown === 'function' ? mod : null;
  } catch { return null; }
}

export async function makeUi(opts = {}) {
  const base = plainUi(opts);
  if (!base.styled || process.env.CCP_PLAIN) return base;
  const tui = await loadPiTui(opts.dir);
  return tui ? piUi(tui, opts) : base;
}

// Feed one stream-json line; `st` carries per-turn counters across lines.
export function onEvent(line, ui, st) {
  let e; try { e = JSON.parse(line); } catch { return; }
  if (e.type === 'system' && e.subtype === 'init') st.model = clean(e.model);
  else if (e.type === 'assistant') {
    for (const b of e.message?.content || []) {
      if (b.type === 'text' && clean(b.text).trim()) ui.text(clean(b.text).trim());
      else if (b.type === 'tool_use') { st.tools++; ui.tool(clean(b.name), toolSummary(b.name, b.input)); }
    }
  } else if (e.type === 'user') {
    for (const b of e.message?.content || []) if (b.type === 'tool_result') ui.toolDone(!b.is_error);
  } else if (e.type === 'result') {
    st.cost = e.total_cost_usd; st.ms = e.duration_ms;
    if (e.is_error && e.result) ui.text(ui.c.red(clean(e.result)));
  }
}
