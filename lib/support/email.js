const nodemailerTransport = require('../../config/nodemailer');

async function sendEmailResponse(receivedEmail) {

  const email = receivedEmail;

  const mailOptions = {
    to: email.fromEmailAddress,
    from: email.toEmailAddress,
    subject: 'Re: ' + email.subject,
    text: email.response,
    inReplyTo: email.emailId
  };

  const response = await nodemailerTransport.sendMail(mailOptions);

  return response;
};

module.exports = {
  sendEmailResponse
};
