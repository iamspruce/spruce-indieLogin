const nodemailer = require("nodemailer");
const pug = require("pug");
/* const htmlToText = require('html-to-text'); */

module.exports = class Email {
  constructor(user, url) {
    this.to = user.username;
    this.me = user.me;
    this.client_id = user.client_id;
    this.url = url;
    this.from = `spruceAuth <${process.env.MAIL_USERNAME}>`;
  }

  newTransport() {
    // Sendgrid
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      me: this.me,
      url: this.url,
      client_id: this.client_id,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      /* text: htmlToText.fromString(html) */
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendEmailVerification() {
    await this.send(
      "verifyEmail",
      "Your Email Verification code (valid for only 5 minutes)"
    );
  }
};
