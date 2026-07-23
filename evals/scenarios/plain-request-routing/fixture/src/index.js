#!/usr/bin/env node
const fs = require('node:fs');
const FILE = process.env.TASKS_FILE || '.tasks.json';

const load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : []);
const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'add') {
  const tasks = load();
  tasks.push({ text: rest.join(' '), done: false, at: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
  console.log(`added (${tasks.length} total)`);
} else if (cmd === 'list') {
  for (const t of load()) console.log(`${t.done ? '[x]' : '[ ]'} ${t.text}`);
} else {
  console.log('usage: index.js add <text> | list');
}
