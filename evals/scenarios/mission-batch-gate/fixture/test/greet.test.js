const { test } = require('node:test');
const assert = require('node:assert');
const { greet } = require('../src/greet');

test('greets by name', () => {
  assert.strictEqual(greet('Ada'), 'Hello, Ada!');
});
