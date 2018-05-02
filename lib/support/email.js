const nodemailerTransport = require('../../config/nodemailer');

async function sendEmail(receivedEmail, credentials) {

  console.log(credentials)

  const email = receivedEmail;

  console.log(credentials.PEWTUBE_VERIFY_EMAIL_PASSWORD);

  const mailOptions = {
    to: 'ceo@pew.tube',
    from: 'ceo@pew.tube',
    subject: 'Your PewTube password has been changed',
    text: `Hello,\n\nThis is a confirmation that the password for your account has just been changed.\n`,
    inReplyTo: '1631ed8eba2.b4c491b5350367.7604674174526936812@pew.tube'
  };

  const response = await nodemailerTransport.sendMail(mailOptions);

  return response;
};

module.exports = {
  sendEmail
}
