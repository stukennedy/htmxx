import { Todo } from '../models/todos';

export default ({ id, name, done }: Todo) => {
  return /*html*/ `
  <li class="${done ? 'completed' : ''}" id="todo-${id}">
    <div class="view">
      <input class="toggle" hx-patch="/todos/${id}" type="checkbox"
      ${done ? 'checked' : ''} hx-target="#todo-${id}" hx-swap="outerHTML" />
      <label
        hx-put="/todos/${id}"
        hx-target="#todo-${id}"
        hx-swap="outerHTML"
      >
        ${name}
      </label>
      <button
        class="destroy"
        hx-delete="/todos/${id}"
        _="on htmx:afterOnLoad remove #todo-${id}"
      ></button>
    </div>
  </li>`;
};
