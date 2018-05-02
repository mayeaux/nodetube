const nodemailer = require('nodemailer');

process.on('unhandledRejection', console.log);

var transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.PEWTUBE_VERIFY_EMAIL_PASSWORD
  }
});

module.exports = transporter;