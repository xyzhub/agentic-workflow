// Toy lint gate: fails on tab indentation in src/.
const fs = require('node:fs');
let bad = 0;
for (const f of fs.readdirSync('src')) {
  const text = fs.readFileSync(`src/${f}`, 'utf8');
  if (/^\t/m.test(text)) { console.error(`${f}: tab indentation`); bad++; }
}
process.exit(bad ? 1 : 0);
