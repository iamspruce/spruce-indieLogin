const AppError = require("./../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const validator = require("validator");
const cheerio = require("cheerio");
const axios = require("axios");

// get trusted client
exports.discoverClient_id = async (url) => {
  const trusted_client = await axios.get(url);
  let trusted_client_ids = [];
  if (trusted_client.status === 200) {
    const $ = cheerio.load(trusted_client.data);
    $("link[rel='client_id']").each((i, el) => {
      const link_element = $(el).attr("href");
      if (validator.isURL(link_element) || link_element.includes("localhost")) {
        trusted_client_ids.push(link_element);
      }
    });
  }

  return trusted_client_ids;
};

exports.discoverClient_app = async (url) => {
  const get_client_info = await axios.get(url);
  let client_info = {};
  if (get_client_info.status === 200) {
    const $ = cheerio.load(get_client_info.data);
    const client_app = $(".h-app");
    if (client_app.length > 0) {
      client_info.app_name = $(".p-name").text();
      client_info.app_url = $(".u-url").attr("href");
      client_info.app_logo = $(".u-logo").attr("src");
    }
  }

  return client_info;
};

// discover redirect_uri
exports.discoverRedirect_uri = async (url) => {
  const trusted_redirect = await axios.get(url);
  let trusted_redirect_uris = [];
  if (trusted_redirect.status === 200) {
    const $ = cheerio.load(trusted_redirect.data);
    $("link[rel='redirect_uri']").each((i, el) => {
      const link_element = $(el).attr("href");
      if (validator.isURL(link_element)) {
        trusted_redirect_uris.push(link_element);
      }
    });
  }

  return trusted_redirect_uris;
};

exports.discoverRelme_links = async (url) => {
  const rel_me = await axios.get(url);
  let rel_me_links = [];
  if (rel_me.status === 200) {
    const $ = cheerio.load(rel_me.data);
    $("link[rel='me'], a[rel='me']").each((i, el) => {
      const link_element = $(el).attr("href");

      if (
        validator.isURL(link_element) ||
        validator.contains(link_element, "mailto")
      ) {
        rel_me_links.push(link_element);
      }
    });
  } else {
    return next(
      new AppError(
        "we encounterd an error when trying to connect to your website",
        401
      )
    );
  }

  return rel_me_links;
};
