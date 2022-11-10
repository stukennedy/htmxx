import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HtmxxRequest } from '../../../lib/interfaces';
import tweets from '../model/tweets';
import Post from './_post';

export default ({ body }: HtmxxRequest) => {
  dayjs.extend(relativeTime);
  const { message, username } = body;
  const tweet = tweets.add(String(message), String(username));
  tweet.time = dayjs().to(dayjs(tweet.time));
  return Post(tweet);
};
