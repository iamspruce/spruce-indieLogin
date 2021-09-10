const GitHubStrategy = require("passport-github2");

const configAuth = require("./config");

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });

  // GITHUB
  passport.use(
    new GitHubStrategy(
      {
        clientID: configAuth.githubAuth.clientID,
        clientSecret: configAuth.githubAuth.clientSecret,
        callbackURL: configAuth.githubAuth.callbackURL,
        passReqToCallback: true,
      },
      function (req, accessToken, refreshToken, profile, done) {
        if (!req.session.me) {
          return done(null, false, {
            message: "Session Expired, please go back and try again",
          });
        }
        const me = req.session.me;
        if (
          !profile._json.bio.includes(me) &&
          !profile._json.blog.includes(me)
        ) {
          return done(null, false, {
            message: `Your GitHub profile linked to ${profile._json.blog} but we were expecting to see ${me}. Make sure you link to ${me} in your GitHub profile.`,
          });
        } else {
          return done(null, profile);
        }
      }
    )
  );
};
