import model from '../../model/tweets';
import type { HtmxxRequest } from '../../../../lib/interfaces';
import Retweets from '../_retweets';

export default ({ params }: HtmxxRequest) => {
  const { id } = params;
  const { retweets } = model.retweet(id);

  return Retweets(id, retweets);
};
