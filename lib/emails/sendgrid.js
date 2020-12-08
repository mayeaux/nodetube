const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ userEmail, userName, subject, text, html }){

  const msg = {
    to: userEmail,
    from: 'noreply@newtube.app', // Use the email address or domain you verified above
    subject: subject,
    text: text,
    html
  };

  const response = await sgMail.send(msg);

  return response
}

module.exports = {
  sendEmail
}

// (async () => {
//   try {
//     const response = await sgMail.send(msg);
//     console.log(response);
//   } catch (error) {
//     console.error(error);
//
//     if (error.response) {
//       console.error(error.response.body)
//     }
//   }
// })();
