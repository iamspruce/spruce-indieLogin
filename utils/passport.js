const GitHubStrategy = require("passport-github2");
const TwitterStrategy = require("passport-twitter").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

var configAuth = require("./config");

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
            message: `We could not find ${me} on your profile, please add it and try again`,
          });
        } else {
          return done(null, profile);
        }
      }
    )
  );
  // TWITTER
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: configAuth.twitterAuth.consumerKey,
        consumerSecret: configAuth.twitterAuth.consumerSecret,
        callbackURL: configAuth.twitterAuth.callbackURL,
        includeEmail: true,
        passReqToCallback: true,
      },
      function (req, token, refreshToken, profile, cb) {
        console.log(profile);

        if (!req.session.me) {
          return done(null, false, {
            message: "Session Expired, please go back and try again",
          });
        }

        const me = req.session.me;
        if (!profile._json.blog.includes(me)) {
          return cb(null, false, {
            message: `We could not find ${me} on your profile, please add it and try again`,
          });
        } else {
          return cb(null, profile);
        }
      }
    )
  );
};
