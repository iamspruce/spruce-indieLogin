const GitHubStrategy = require("passport-github2");
const TwitterStrategy = require("passport-twitter");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

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
      },
      async function (token, tokenSecret, profile, cb) {
        console.log(profile);

        if (!profile) {
          // This can happen if you haven't enabled email access in your twitter app permissions
          return done(new Error("Twitter OAuth response doesn't have email."));
        }
      }
    )
  );

  // GOOGLE
  passport.use(
    new GoogleStrategy(
      {
        callbackURL: configAuth.googleAuth.callbackURL,
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
      },
      async (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );

  //FACEBOOK
  passport.use(
    new FacebookStrategy(
      {
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
      },
      function (accessToken, refreshToken, profile, cb) {
        return cb(null, profile);
      }
    )
  );
};
