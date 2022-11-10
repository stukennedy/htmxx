import { v4 as uuid } from 'uuid';

export type Todo = {
  id: string;
  name: string;
  done: boolean;
};

class Todos {
  todos: Todo[] = [];

  constructor() {
    this.todos = [
      {
        id: uuid(),
        name: 'Taste htmx',
        done: true,
      },
      {
        id: uuid(),
        name: 'Buy a unicorn',
        done: false,
      },
    ];
  }

  addTodo(name: string) {
    const todo = {
      id: uuid(),
      name,
      done: false,
    };
    this.todos.push(todo);
    return todo;
  }

  toggleTodo(id: string) {
    const idx = this.todos.findIndex((t) => t.id === id);
    this.todos[idx].done = !this.todos[idx].done;
    return this.todos[idx];
  }

  deleteTodo(id: string) {
    const idx = this.todos.findIndex((t) => t.id === id);
    this.todos.splice(idx, 1);
    return;
  }

  renameTodo(id: string, name: string) {
    const idx = this.todos.findIndex((t) => t.id === id);
    this.todos[idx].name = name;
    return this.todos[idx];
  }

  getTodos() {
    return this.todos;
  }

  getTodo(id: string) {
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
export default new Todos();
