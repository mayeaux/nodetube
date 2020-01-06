const nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

process.on('unhandledRejection', console.log);

const zohoTransport = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.NODETUBE_VERIFY_EMAIL_PASSWORD
  }
});

let mailgunTransport;
if(process.env.FORGOT_PASSWORD_EMAIL_FUNCTIONALITY_ON == 'true'){
  mailgunTransport = nodemailer.createTransport(mg({
    auth: {
      api_key: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  }));
}

module.exports = {
  mailgunTransport,
  zohoTransport
};
