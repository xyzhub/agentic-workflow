const fs = require('node:fs');
const FILE = process.env.LINKS_FILE || '.links.json';

exports.load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : []);
exports.save = (links) => fs.writeFileSync(FILE, JSON.stringify(links, null, 2));
