const GitHubStrategy = require("passport-github2");
const TwitterStrategy = require("passport-twitter").Strategy;
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

  // GOOGLE
  passport.use(
    new GoogleStrategy(
      {
        callbackURL: configAuth.googleAuth.callbackURL,
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        if (!req.session.me) {
          return done(null, false, {
            message: "Session Expired, please go back and try again",
          });
        }

        if (!profile) {
          return done(null, false, {
            message: `We could not connect to google`,
          });
        } else {
          return done(null, profile);
        }
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
        profileFields: ["id", "displayName", "website"],
        passReqToCallback: true,
      },
      function (req, accessToken, refreshToken, profile, cb) {
        if (!req.session.me) {
          return done(null, false, {
            message: "Session Expired, please go back and try again",
          });
        }

        const me = req.session.me;
        console.log(profile, req.session);
        if (!profile._json.website.includes(me)) {
          return cb(null, false, {
            message: `We could not find ${me} on your facebook profile, please add it and try again`,
          });
        } else {
          return cb(null, profile);
        }
      }
    )
  );
};
