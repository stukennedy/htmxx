import model from '../../model/tweets';
import type { HtmxxRequest } from '../../../../lib/interfaces';
import Likes from '../_likes';

export default ({ params }: HtmxxRequest) => {
  const { id } = params;
  const { likes } = model.like(id);

  return Likes(id, likes);
};
