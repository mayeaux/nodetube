const nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

process.on('unhandledRejection', console.log);

const zohoTransport = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.PEWTUBE_VERIFY_EMAIL_PASSWORD
  }
});

// console.log(process.env.MAILGUN_API_KEY)

const mailgunTransport = nodemailer.createTransport(mg({
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: 'sandbox1976f4ad59764de18b0ba4d0040a471c.mailgun.org'
  }
}));

module.exports = {
  mailgunTransport,
  zohoTransport
};
