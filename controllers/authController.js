const url = require("url");
const AppError = require("./../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const validator = require("validator");
const generateUniqueId = require("generate-unique-id");
const querystring = require("qs");
const User = require("../model/user");
const Email = require("./../utils/email");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const {
  discoverClient_id,
  discoverClient_app,
  discoverRedirect_uri,
  discoverRelme_links,
} = require("../utils/discovery");

const canonicalizeUrl = (uri) => {
  const newUri = url.parse(uri);
  return newUri.href;
};

const supportedProviders = (rels) => {
  const supported = [];
  rels.forEach((el) => {
    if (el.includes("github")) {
      supported.push({
        provider: url.parse(el).hostname.split(".")[0],
        username: url.parse(el).pathname.split("/")[1],
        display: `github.com${url.parse(el).pathname}`,
      });
    } else if (el.includes("twitter")) {
      supported.push({
        provider: url.parse(el).hostname.split(".")[0],
        username: url.parse(el).pathname.split("/")[1],
        display: `twitter.com${url.parse(el).pathname}`,
      });
    } else if (el.includes("mailto")) {
      supported.push({
        provider: url.parse(el).protocol,
        username: url.parse(el).href.split(":")[1],
        display: url.parse(el).href.split(":")[1],
      });
    } else if (el.includes("facebook")) {
      supported.push({
        provider: url.parse(el).hostname.split(".")[0],
        username: url.parse(el).pathname.split("/")[1],
        display: `fb.com${url.parse(el).pathname}`,
      });
    }
  });
  return supported;
};

exports.auth = catchAsync(async (req, res, next) => {
  try {
    const { me, client_id, redirect_uri, state } = req.query;

    // CLIENT_ID

    if (!client_id || client_id == "") {
      return next(new AppError("The Request is missing the client id", 400));
    } else if (
      !validator.isURL(client_id) &&
      !client_id.indexOf("localhost") == -1
    ) {
      return next(new AppError("The client_id parameter is not a URL", 400));
    }
    const expected_client_id = canonicalizeUrl(client_id);

    // CHECK IF CLIENT_ID IF TRUSTED
    const trusted_client_ids = await discoverClient_id(
      `https://indie.iamspruce.dev/`
    );

    if (
      !trusted_client_ids.includes(expected_client_id) &&
      !expected_client_id.includes("localhost")
    ) {
      return next(
        new AppError(
          `This client_id is not trusted: ${expected_client_id}`,
          400
        )
      );
    }

    // Fetch client_id app info
    const client_info = await discoverClient_app(expected_client_id);

    // REDIRECT_URI

    if (!redirect_uri || redirect_uri == "") {
      return next(
        new AppError("The Request is missing the redirect_uri id", 400)
      );
    } else if (
      !validator.isURL(redirect_uri) &&
      !redirect_uri.indexOf("localhost") == -1
    ) {
      return next(new AppError("The redirect_uri parameter is not a URL", 400));
    }

    // fetch trusted redirect_uri
    const trusted_redirect_uris = await discoverRedirect_uri(
      expected_client_id
    );

    //Check if the redirect uri is on the same domain with client_id
    const client_host = url.parse(client_id).hostname;
    const redirect_host = url.parse(redirect_uri).hostname;
    if (
      client_host !== redirect_host &&
      trusted_redirect_uris.includes(redirect_uri)
    ) {
      return next(
        new AppError(
          "The client_id and redirect_uri must be on the same domain",
          400
        )
      );
    }

    // STATE
    if (!state || state == "") {
      return next(new AppError("This request is missing the state", 400));
    }
    const login_request = { client_id, redirect_uri, state, client_info };
    // ME
    if (!me || me == "") {
      const if_me = req.session.me ? req.session.me : "";
      return res.status(302).render("login-form", {
        title: `Sign In using spruceAuth`,
        me: if_me,
        client_id: login_request.client_id,
        redirect_uri: login_request.redirect_uri,
        state: login_request.state,
        app_name: login_request.client_info.app_name,
        app_url: login_request.client_info.app_url,
        app_logo: login_request.client_info.app_logo,
      });
    } else if (!validator.isURL(me) && !me.indexOf("localhost") == -1) {
      return next(
        new AppError(
          "The domain entered dosen't look like a url, please go back and try again",
          400
        )
      );
    }

    const expected_me = canonicalizeUrl(me);

    req.session.me = expected_me;
    // IF THE USER DOMAIN IS ALREADY IN THE SESSION SKIP AUTHENTICATION
    if (expected_me == req.session.me && req.session.code) {
      const query = querystring.stringify({
        action: "logout",
        code: req.session.code,
        client_id,
        redirect_uri,
        state,
      });
      const switch_account = `/auth?${query}`;
      return res.status(200).render("prompt", {
        title: `Sign In using spruceAuth`,
        me: req.session.me,
        client_id: login_request.client_id,
        redirect_uri: login_request.redirect_uri,
        app_name: login_request.client_info.app_name,
        app_url: login_request.client_info.app_url,
        app_logo: login_request.client_info.app_logo,
        switch_account,
      });
    }

    // SET SESSIONS
    req.session.login_request = login_request;

    // GET REL="ME" LINKS
    const rel_me_links = await discoverRelme_links(expected_me);

    const supported = supportedProviders(rel_me_links);
    if (supported.length == 0) {
      return next(
        new AppError(
          "None of the rel=me URLs found on your page were recognized as a supported provider",
          401
        )
      );
    } else {
      return res.status(200).render("select", {
        title: "Authenticate",
        me: req.session.me,
        client_id: login_request.client_id,
        redirect_uri: login_request.redirect_uri,
        app_name: login_request.client_info.app_name,
        app_url: login_request.client_info.app_url,
        app_logo: login_request.client_info.app_logo,
        choices: supported,
      });
    }
  } catch (error) {
    return new AppError(error.message, 503);
  }
});

exports.verify = catchAsync(async (req, res, next) => {
  const { code, client_id, redirect_uri } = req.body;

  // Check if request is missing any parameter
  if (!code || code == "") {
    return next(new AppError("Request is missing The Code parameter", 401));
  }
  // client_id is missing
  if (!client_id || client_id == "") {
    return next(new AppError("Request is missing The Code parameter", 401));
  }
  // redirect_id is missing
  if (!redirect_uri || redirect_uri == "") {
    return next(new AppError("Request is missing The Code parameter", 401));
  }

  // Check if code still exists
  const logged_user = await User.findOne({ code });

  if (!logged_user) {
    return next(
      new AppError("The authorization code expired or is Invalid", 400)
    );
  }

  // Check if the code actually belongs to the client
  if (logged_user.client_id !== client_id) {
    return next(
      new AppError(
        `The client_id: ${client_id} in the request did not match the client_id the code was issued to, please check that your client_id is an exact match of the one in the post request`,
        400
      )
    );
  }

  if (logged_user.redirect_uri !== redirect_uri) {
    return next(
      new AppError(
        `The redirect_uri: ${redirect_uri} in the request did not match the redirect_uri the code was issued to, please check that your redirect_uri is an exact match of the one in the post request`,
        400
      )
    );
  }

  return res.status(200).json({
    me: logged_user.me,
  });
});

exports.sendEmail = catchAsync(async (req, res, next) => {
  const { me, client_id, redirect_uri, state, username } = req.query;

  const token = jwt.sign({ me }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  const url = `https://indie.iamspruce.dev/auth/email/${token}`;
  await new Email(req.query, url).sendEmailVerification();

  return res.status(200).render("confirmEmail", {
    me,
    client_id,
    redirect_uri,
    state,
    username,
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  try {
    // Verify token
    const decoded = await promisify(jwt.verify)(
      req.params.token,
      process.env.JWT_SECRET
    );

    // Find the user whose Id was used to verify the token

    if (decoded.me !== req.session.me) {
      return next(
        new AppError("Code verification failed or session expired", 400)
      );
    }

    const { client_id, redirect_uri, state } = req.session.login_request;

    const code = generateUniqueId();
    req.session.code = code;

    const query = querystring.stringify({
      code,
      state,
    });

    await User.create({
      me: req.session.me,
      client_id,
      redirect_uri,
      code,
    });
    return res.status(301).redirect(`${redirect_uri}?${query}`);
  } catch (err) {
    return next(new AppError(err, 400));
  }
});
