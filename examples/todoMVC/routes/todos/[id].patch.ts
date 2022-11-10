import model from '../../models/todos';
import TodoItem from '../_todo-item';
import ItemsLeft from '../_items-left';
import type { HtmxxRequest } from '../../interfaces';

export default (request: HtmxxRequest) => {
  const todo = model.toggleTodo(request.params.id);
  const itemsLeft = model.getItemsLeft();

  return TodoItem(todo) + ItemsLeft(itemsLeft);
};
