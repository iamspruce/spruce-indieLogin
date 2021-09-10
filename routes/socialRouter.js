const express = require("express");
const router = express.Router();
const AppError = require("./../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const passport = require("passport");
const querystring = require("qs");

router.route("/").get(
  catchAsync(async (req, res, next) => {
    req.session.provider = req.query.provider;

    if (req.query.provider === "mailto:") {
      if (!req.session.login_request || !req.session.me) {
        return next(
          new AppError(
            "Sorry your session has expired please go back and try again"
          )
        );
      }

      const query = querystring.stringify({
        me: req.session.me,
        client_id: req.session.login_request.client_id,
        redirect_uri: req.session.login_request.redirect_uri,
        state: req.session.login_request.state,
        username: req.query.username,
      });
      return res.redirect(`auth/email?${query}`);
    } else {
      req.session.provider = req.query.provider;
    }
    passport.authenticate(req.session.provider)(req, res, next);
  })
);

module.exports = router;
