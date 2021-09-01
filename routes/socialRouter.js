const express = require("express");
const router = express.Router();
const passport = require("passport");
const querystring = require("qs");

router.route("/").get(function (req, res, next) {
  req.session.provider = req.query.provider;
  if (req.query.provider === "mailto:") {
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
});

module.exports = router;
