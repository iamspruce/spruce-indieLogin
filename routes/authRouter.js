const express = require("express");
const router = express.Router();
const {
  auth,
  verify,
  sendEmail,
  verifyEmail,
} = require("./../controllers/authController");
const passport = require("passport");
const querystring = require("qs");
const User = require("../model/user");

router.route("/").post(verify).get(auth);
router.get("/email", sendEmail);
router.get("/email/:token", verifyEmail);

router.get("/callback", (req, res, next) => {
  passport.authenticate(
    req.session.provider,
    { failureFlash: true, successFlash: true },
    (err, user, info) => {
      if (err) {
        return res.status(401).render("error", {
          title: "error",
          error: err,
        });
      }
      if (!user) {
        return res.status(401).render("error", {
          title: "error",
          error: info,
        });
      }

      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }
        const { code } = req.query;
        req.session.code = code;
        const query = querystring.stringify({
          code: req.session.code,
          state: req.session.login_request.state,
        });

        await User.create({
          me: req.session.me,
          client_id: req.session.login_request.client_id,
          redirect_uri: req.session.login_request.redirect_uri,
          code,
        });
        res
          .status(301)
          .redirect(`${req.session.login_request.redirect_uri}?${query}`);
      });
    }
  )(req, res, next);
});

module.exports = router;
