const { v4: uuid } = require('uuid');

class Tweets {
  tweets = [];

  constructor() {
    this.tweets = [];
  }

  add(message, username) {
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

  like(id) {
    const idx = this.tweets.findIndex((t) => t.id === id);
    this.tweets[idx].likes += 1;
    return this.tweets[idx];
  }

  retweet(id) {
    const idx = this.tweets.findIndex((t) => t.id === id);
    this.tweets[idx].retweets += 1;
    return this.tweets[idx];
  }

  delete(id) {
    const idx = this.tweets.findIndex((t) => t.id === id);
    this.tweets.splice(idx, 1);
    return;
  }

  getAll() {
    return this.tweets;
  }

  get(id) {
    const tweet = this.tweets.find((t) => t.id === id);
    return tweet;
  }
}
module.exports = new Tweets();
