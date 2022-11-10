import model from '../models/todos';
import ItemsLeft from './_items-left';
import { filterTodos } from '../models/utils';
import TodoList from './_todo-list';

export default (filter: string) => {
  const todos = filterTodos(filter, model.getTodos());
  const itemsLeft = model.getItemsLeft();
  const allClass = filter == 'all' || !filter ? 'selected' : '';
  const activeClass = filter == 'active' ? 'selected' : '';
  const completedClass = filter == 'completed' ? 'selected' : '';

  return /*html*/ `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Template • TodoMVC</title>
    <link rel="stylesheet" href="/css/base.css" />
    <link rel="stylesheet" href="/css/index.css" />
    <script src="htmx.min.js"></script>
    <script src="_hyperscript.min.js"></script>
  </head>  
  <body>
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <form
          hx-post="/todos"
          hx-target="#todo-list"
          hx-swap="afterbegin"
          _="on htmx:afterOnLoad set #txtTodo.value to ''"
        >
          <input
            class="new-todo"
            id="txtTodo"
            name="todo"
            placeholder="What needs to be done?"
            autofocus=""
          />
        </form>
      </header>
      <section class="main">
        <input class="toggle-all" id="toggle-all" type="checkbox" />
        <label for="toggle-all">Mark all as complete</label>
        ${TodoList(todos)}
      </section>
      <footer class="footer">
        ${ItemsLeft(itemsLeft)}
        <ul
          class="filters"
          _="on htmx:afterOnLoad take .selected from .link for window.location"
        >
          <li><a href="/?filter=all" class="${allClass}">All</a></li>
          <li><a href="/?filter=active" class="${activeClass}">Active</a></li>
          <li>
            <a href="/?filter=completed" class="${completedClass}"
              >Completed</a
            >
          </li>
        </ul>
        <button
          class="clear-completed"
          hx-post="/todos/clear-completed"
          hx-target="#todo-list"
        >
          Clear completed
        </button>
      </footer>
    </section>
    <footer class="info">
      <p>Click to edit a todo</p>
      <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
      <p>
        Created by
        <a href="https://github.com/stukennedy">Stu Kennedy</a>
      </p>
      <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
  </body>
</html>
  `;
};
