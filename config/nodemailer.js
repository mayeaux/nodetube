const nodemailer = require('nodemailer');

process.on('unhandledRejection', console.log);

var transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'ceo@pew.tube',
    pass: process.env.PEWTUBE_VERIFY_EMAIL_PASSWORD
  }
});

module.exports = transporter