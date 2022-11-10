import { Todo } from '../models/todos';
import TodoItem from './_todo-item';

export default (todos: Todo[]) => {
  return /*html*/ `
  <ul class="todo-list" id="todo-list">
    ${todos.map((todo) => TodoItem(todo))}
  </ul>
`;
};
