import model from '../../model/tweets';
import type { HtmxxRequest } from '../../../../lib/interfaces';
import Likes from '../_likes';

export default ({ params, broadcast }: HtmxxRequest) => {
  const { id } = params;
  const { likes } = model.like(id);

  const markup = Likes(id, likes);
  broadcast(markup);
  return markup;
};
