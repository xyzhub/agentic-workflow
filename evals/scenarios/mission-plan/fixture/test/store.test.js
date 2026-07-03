const { test } = require('node:test');
const assert = require('node:assert');

process.env.NOTES_FILE = '.notes-test.json';
const { load, save } = require('../src/store');

test('round-trips notes', () => {
  save([{ text: 'hello' }]);
  assert.strictEqual(load()[0].text, 'hello');
  require('node:fs').unlinkSync('.notes-test.json');
});
