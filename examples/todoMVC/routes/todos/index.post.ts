import model from '../../models/todos';
import TodoItem from '../_todo-item';
import ItemsLeft from '../_items-left';
import { HtmxxRequest } from '../../../../lib/';

export default (request: HtmxxRequest) => {
  const todo = model.addTodo(String(request.body.todo));
  const itemsLeft = model.getItemsLeft();

  return TodoItem(todo) + ItemsLeft(itemsLeft);
};
