import { Todo } from '../models/todos';

export default ({ id, name }: Todo) => {
  return /*html*/ `
    <form hx-post="/todos/update/${id}">
      <input class="edit" type="text" name="name" value="${name}" />
    </form>`;
};
