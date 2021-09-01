// STEP 1: import the dependencies
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const qs = require("qs");

const axios = require("axios");

// STEP 2: import the User Model
const User = require("./../model/demo-user");

// STEP 3: create a function to sign the Json Web Token and send it has a cookie
const createSendToken = (user, statusCode, req, res) => {
  // STEP 3.1: Sign the json web token and store it in a variable called token
  const id = user._id;
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  // STEP 3.3: Send the cookie to the user
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES * 60000),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  // STEP 3.4: Redirect us back to homepage
  // Here you can send a response back to the user rather than redirecting
  res.status(statusCode).redirect("/");
};

// STEP 4: Create the authentication middleware
// This middleware would be called when Indielogin Redirects back to our site
exports.login = async (req, res, next) => {
  try {
    // STEP 4.1: destructure code and state from req.query
    const { code, state } = req.query;
    // STEP 4.2: Get state from our Environmental variables and store it in a variable called originalState
    // You will need to create an Environmental Variable called state
    const originalState = process.env.state;
    // STEP 4.3: Check if the request returned a code or state
    // if it didn't return a code or state then end the task and return
    // here you would want to throw an error - in your own apps
    if (!code || !state) {
      return next(console.log("error code wasn't found"));
    }

    // STEP 4.4: check if the returned state is equal to the one we have in our Environmental
    // if its not equal then throw an error
    if (state !== originalState) {
      return next(console.log("state has changed"));
    }

    // STEP 4.5: In this next we want to check if the returned data are still valid
    // This is done to make sure the data hasn't being tampered with
    // STEP: 4.5.1: define the data and the header
    const data = qs.stringify({
      code,
      redirect_uri: "https://indie.iamspruce.dev/demo/login",
      client_id: "https://indie.iamspruce.dev",
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
    };
    // STEP 4.5.2: make a post request to `https://indielogin.com/auth` with the data and the header
    const newReq = await axios.post("http://indie.iamspruce.dev/auth", data, {
      headers,
    });

    // STEP 4.6: Next we want to check if the user already exists
    const user = await User.findOne({ me: newReq.data.me });

    // STEP 4.7: If the user already exists just call the createSendToken function we created at the beginning
    // else if the user dosen't exist then create the user
    if (user) {
      createSendToken(user, 200, req, res);
    } else {
      const newUser = await User.create({
        me: newReq.data.me,
        username: newReq.data.me.split("/")[2],
      });
      createSendToken(newUser, 201, req, res);
    }
  } catch (err) {
    console.log(err);
  }
};

exports.isLoggedIn = async (req, res, next) => {
  // Get token from req.cookies
  if (req.cookies.jwt) {
    try {
      // Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Find the user whose Id was used to verify the token
      const findUser = await User.findById(decoded.id);

      // return that user and pass it to our templates
      res.locals.user = findUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
