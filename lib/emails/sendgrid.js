const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'noreply@newtube.app',
  from: 'noreply@newtube.app', // Use the email address or domain you verified above
  subject: 'Sending with Twilio SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
//ES6
// sgMail
//   .send(msg)
//   .then(() => {}, error => {
//     console.error(error);
//
//     if (error.response) {
//       console.error(error.response.body)
//     }
//   });
//ES8
(async () => {
  try {
    const response = await sgMail.send(msg);
    console.log(response);
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  }
})();

//
// async function sendEmail({ userEmail, userName, subject, text, html }){
//
//   const request = mailjet
//     .post("send", {'version': 'v3.1'})
//     .request({
//       "Messages":[{
//         "From": {
//           "Email": noReplyFromEmail,
//           "Name": noReplyFromName
//         },
//         "To": [{
//           "Email": userEmail,
//           "Name": userName
//         }],
//         "Subject": subject,
//         "TextPart": text,
//         "HTMLPart": html
//       }]
//     })
//
//   return request
// }
