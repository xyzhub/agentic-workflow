const fs = require('node:fs');
const FILE = process.env.NOTES_FILE || '.notes.json';

exports.load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : []);
exports.save = (notes) => fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
