const { v4: uuid } = require('uuid');

class Todos {
  todos = [];

  constructor() {
    this.todos = [
      {
        id: uuid(),
        name: 'Taste htmx',
        done: true,
        checked: 'checked',
        completed: 'completed',
      },
      {
        id: uuid(),
        name: 'Buy a unicorn',
        done: false,
        checked: '',
        completed: '',
      },
    ];
  }

  addTodo(name) {
    const todo = {
      id: uuid(),
      name,
      done: false,
    };
    this.todos.push(todo);
    return todo;
  }

  toggleTodo(id) {
    const idx = this.todos.findIndex((t) => t.id === id);
    this.todos[idx].done = !this.todos[idx].done;
    this.todos[idx].checked = this.todos[idx].done ? 'checked' : '';
    this.todos[idx].completed = this.todos[idx].done ? 'completed' : '';
    return this.todos[idx];
  }

  deleteTodo(id) {
    const idx = this.todos.findIndex((t) => t.id === id);
    this.todos.splice(idx, 1);
    return;
  }

  renameTodo(id, name) {
    const idx = this.todos.findIndex((t) => t.id === id);
    this.todos[idx].name = name;
    return this.todos[idx];
  }

  getTodos() {
    return this.todos;
  }

  getTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    return todo;
  }

  getItemsLeft() {
    return this.todos.filter((t) => !t.done).length;
  }

  clearCompleted() {
    const newTodos = this.todos.filter((t) => !t.done);
    this.todos = newTodos;
    return this.todos;
  }
}
module.exports = new Todos();
