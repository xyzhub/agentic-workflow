#!/usr/bin/env node
const fs = require('node:fs');
const FILE = process.env.NOTES_FILE || '.notes.json';

const load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : []);
const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'add') {
  const notes = load();
  notes.push({ text: rest.join(' '), at: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
  console.log(`added (${notes.length} total)`);
} else if (cmd === 'list') {
  for (const n of load()) console.log(`- ${n.text}`);
} else {
  console.log('usage: index.js add <text> | list');
}
