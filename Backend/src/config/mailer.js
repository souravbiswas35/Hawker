const nodemailer = require("nodemailer");
const { smtp } = require("./env");

const isSmtpConfigured = Boolean(smtp.host && smtp.user && smtp.pass);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: false,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    })
  : null;

module.exports = { transporter, isSmtpConfigured };
