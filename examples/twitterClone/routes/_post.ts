import { Tweet } from '../model/tweets';
import Retweets from './_retweets';
import Likes from './_likes';

export default (tweet: Tweet) => {
  return /*html*/ `
    <div hx-swap-oob="afterbegin:#timeline">
      <div class="card mb-2 shadow-sm" id="tweet-${tweet.id}">
        <div class="card-body">
          <div class="d-flex">
            <img class="me-4" src="${tweet.avatar}" width="108" />
            <div>
              <h5 class="card-title text-muted">
                ${tweet.username}<small>: ${tweet.time}</small>
              </h5>
              <div class="card-text lead mb-2">${tweet.message}</div>
              ${Retweets(tweet.id, tweet.retweets)} 
              ${Likes(tweet.id, tweet.likes)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
