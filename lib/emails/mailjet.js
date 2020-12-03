// const mailJetApiPrivateKey = process.env.mailJetPrivateKey;
// const mailJetApiPublicKey = process.env.mailJetPublicKey;




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

async function sendEmail(userEmail, userName, subject, text, html){
  const request = mailjet
    .post("send", {'version': 'v3.1'})
    .request({
      "Messages":[{
        "From": {
          "Email": "noreply@newtube.app",
          "Name": "NewTube Support"
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
    const response = await sendEmail();

    console.log(response);
  } catch (err){
    console.log(err)
  }
};

main();


