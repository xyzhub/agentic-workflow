// In-memory todo store — persistence is on the roadmap (see PLAN.md).
const todos = [];

function add(text) {
  const todo = { id: todos.length + 1, text, done: false };
  todos.push(todo);
  return todo;
}

function complete(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) throw new Error(`no todo ${id}`);
  todo.done = true;
  return todo;
}

function list() {
  return [...todos];
}

module.exports = { add, complete, list };
