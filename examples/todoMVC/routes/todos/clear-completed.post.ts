import model from '../../models/todos';
import { filterTodos } from '../../models/utils';
import TodoList from '../_todo-list';
import ItemsLeft from '../_items-left';
import type { HtmxxRequest } from '../../interfaces';

export default (request: HtmxxRequest) => {
  const todos = filterTodos(request.query.filter, model.clearCompleted());
  const itemsLeft = model.getItemsLeft();
  return TodoList(todos) + ItemsLeft(itemsLeft);
};
