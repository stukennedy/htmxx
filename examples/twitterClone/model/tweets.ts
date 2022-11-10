import { v4 as uuid } from 'uuid';

export type Tweet = {
  id: string;
  message: string;
  username: string;
  retweets: number;
  likes: number;
  time: string;
  avatar: string;
};

class Tweets {
  tweets: Tweet[] = [];

  constructor() {
    this.tweets = [];
  }

  add(message: string, username: string) {
    const tweet = {
      id: uuid(),
      message,
      username,
      retweets: 0,
      likes: 0,
      time: new Date().toString(),
      avatar:
        'https://ui-avatars.com/api/?background=random&rounded=true&name=' +
        username,
    };
    this.tweets.push(tweet);
    return tweet;
  }

  like(id: string) {
    const idx = this.tweets.findIndex((t) => t.id === id);
    this.tweets[idx].likes += 1;
    return this.tweets[idx];
  }

  retweet(id: string) {
    const idx = this.tweets.findIndex((t) => t.id === id);
    this.tweets[idx].retweets += 1;
    return this.tweets[idx];
  }

  delete(id: string) {
    const idx = this.tweets.findIndex((t) => t.id === id);
    this.tweets.splice(idx, 1);
    return;
  }

  getAll() {
    return this.tweets;
  }

  get(id: string) {
    const tweet = this.tweets.find((t) => t.id === id);
    return tweet;
  }
}
export default new Tweets();
