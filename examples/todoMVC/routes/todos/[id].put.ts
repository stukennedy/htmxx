import type { HtmxxRequest } from '../../interfaces';
import model from '../../models/todos';
import EditItem from '../_edit-item';

export default (request: HtmxxRequest) => {
  const todo = model.getTodo(request.params.id);

  return EditItem(todo!);
};
