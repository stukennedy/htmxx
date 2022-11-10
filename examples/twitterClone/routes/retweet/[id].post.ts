import model from '../../model/tweets';
import type { HtmxxRequest } from '../../../../lib/interfaces';
import Retweets from '../_retweets';

export default ({ params, broadcast }: HtmxxRequest) => {
  const { id } = params;
  const { retweets } = model.retweet(id);

  const markup = Retweets(id, retweets);
  broadcast(markup);
  return markup;
};
