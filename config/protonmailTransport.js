// const pm = require('protonmail-api');
//
// let protonMailTransport;
// (async function(){
//   protonMailTransport = await pm.connect({
//     username: process.env.PROTONMAIL_USERNAME,
//     password: process.env.PROTONMAIL_PASSWORD
//   });
//
//   console.log('Protonmail setup');
// })()
//
// async function sendProtonMail(mailOptions){
//   const response = await protonMailTransport.sendEmail(mailOptions);
//   return response;
// }
//
// module.exports = {
//   sendProtonMail
// };
