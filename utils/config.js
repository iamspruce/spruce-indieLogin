module.exports = {
  twitterAuth: {
    consumerKey: process.env.twitterConsumerKey,
    consumerSecret: process.env.twitterConsumerSecret,
    callbackURL: process.env.appsCallback,
  },

  githubAuth: {
    clientID: process.env.githubClientId,
    clientSecret: process.env.githubSecret,
    callbackURL: process.env.appsCallback,
  },
  googleAuth: {
    clientID: process.env.googleClientId,
    clientSecret: process.env.googleSecret,
    callbackURL: process.env.appsCallback,
  },
};
