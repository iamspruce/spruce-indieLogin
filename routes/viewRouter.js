const express = require("express");
const { login, isLoggedIn } = require("../controllers/viewController");

const router = express.Router();

router.get("/", isLoggedIn, (req, res) => {
  res.status(200).render("index", {
    title: "Homepage",
  });
});
router.get("/demo/login", login);

module.exports = router;
