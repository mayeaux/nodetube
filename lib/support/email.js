const nodemailerTransport = require('../../config/nodemailer');

function testIfAlreadyResponse(subject){
  const alreadyAReply = subject.substring(0, 4) == 'Re: ';

  return alreadyAReply
}


async function sendEmailResponse(receivedEmail) {

  const email = receivedEmail;

  const alreadyAResponse = testIfAlreadyResponse(email.subject);

  let subject;
  if(alreadyAResponse){
    subject = email.subject
  } else {
    subject = 'Re: ' + email.subject
  }

  const mailOptions = {
    to: email.fromEmailAddress,
    from: email.toEmailAddress,
    subject,
    text: email.response,
    inReplyTo: email.emailId
  };

  const response = await nodemailerTransport.sendMail(mailOptions);

  return response;
};

module.exports = {
  sendEmailResponse
};
