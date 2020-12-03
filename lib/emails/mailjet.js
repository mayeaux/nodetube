const mailJetApiPrivateKey = process.env.MAILJET_PRIVATE_KEY;
const mailJetApiPublicKey = process.env.MAILJET_PUBLIC_KEY;

const mailjet = require ('node-mailjet')
  .connect(mailJetApiPrivateKey, mailJetApiPublicKey)

// .connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)

const request = mailjet
  .post("send", {'version': 'v3.1'})
  .request({
    "Messages":[{
      "From": {
        "Email": "noreply@newtube.app",
        "Name": "NewTube Support"
      },
      "To": [{
        "Email": "nodetubeapp@gmail.com",
        "Name": "NewTube User"
      }],
      "Subject": "Thank you for subscribing to NewTube",
      "TextPart": "Thank you for subscribing to NewTube.",
      "HTMLPart": "<h3>Thank you for subscribing to NewTube. <a href=\"https://newtube.app/\">NewTube</a></h3><br />"
    }]
  })

// const noReplyEmail = process.env.NO_REPLY_EMAIL;
const noReplyFromEmail = "noreply@newtube.app";

// const noReplyEmail = process.env.NO_REPLY_EMAIL;
const noReplyFromName = "No Reply - NewTube";


async function sendEmail(userEmail, userName, subject, text, html){
  const request = mailjet
    .post("send", {'version': 'v3.1'})
    .request({
      "Messages":[{
        "From": {
          "Email": noReplyFromEmail,
          "Name": noReplyFromName
        },
        "To": [{
          "Email": userEmail,
          "Name": userName
        }],
        "Subject": subject,
        "TextPart": text,
        "HTMLPart": html
      }]
    })

  return request
}

async function main(){
  try {
    const userName = 'NewTube User';
    const userEmail = 'noreply@newtube.app';
    const subject = 'Thank you for subscribing to NewTube';
    const text = 'Thank you for subscribing to NewTube.';
    const html = '<h3>Thank you for subscribing to NewTube. <a href=\"https://newtube.app/\">NewTube</a></h3><br />"';

    const response = await sendEmail(userEmail, userName, subject, text, html);

    console.log(response);
  } catch (err){
    console.log(err)
  }
};

main();


