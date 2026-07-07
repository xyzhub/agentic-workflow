const { test } = require('node:test');
const assert = require('node:assert');

process.env.LINKS_FILE = '.links-test.json';
const { load, save } = require('../src/store');

test('round-trips links', () => {
  save([{ url: 'https://example.com', tags: ['demo'] }]);
  assert.strictEqual(load()[0].url, 'https://example.com');
  require('node:fs').unlinkSync('.links-test.json');
});
