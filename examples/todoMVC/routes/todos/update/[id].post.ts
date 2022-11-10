import { HtmxxRequest } from '../../../interfaces';
import model from '../../../models/todos';
import TodoItem from '../../_todo-item';

export default ({ params, body }: HtmxxRequest) => {
  const todo = model.renameTodo(params.id, String(body.name));

  return TodoItem(todo);
};
