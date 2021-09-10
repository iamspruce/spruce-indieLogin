module.exports = {
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
