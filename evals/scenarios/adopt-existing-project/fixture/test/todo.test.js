const { test } = require('node:test');
const assert = require('node:assert');
const { add, complete, list } = require('../src/todo');

test('add and list todos', () => {
  add('write eval');
  assert.strictEqual(list().length, 1);
  assert.strictEqual(list()[0].done, false);
});

test('complete marks done', () => {
  const t = add('ship it');
  complete(t.id);
  assert.strictEqual(list().find((x) => x.id === t.id).done, true);
});
