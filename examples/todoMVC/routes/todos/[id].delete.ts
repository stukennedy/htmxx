import model from '../../models/todos';
import ItemsLeft from '../_items-left';
import type { HtmxxRequest } from '../../interfaces';

export default (request: HtmxxRequest) => {
  model.deleteTodo(request.params.id);
  const itemsLeft = model.getItemsLeft();

  return ItemsLeft(itemsLeft);
};
