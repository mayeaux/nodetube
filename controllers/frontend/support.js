const ReceivedEmail = require('../../models/index').ReceivedEmail

exports.getReceivedEmails = async (req, res) => {

  // exclude uploads without an uploadUrl
  let receivedEmails = await ReceivedEmail.find({}).populate().lean();

  receivedEmails = receivedEmails.reverse();

  // console.log(receivedEmails);

  res.render('moderator/receivedEmails', {
    title: 'Received Emails',
    receivedEmails
  });

};

exports.getReceivedEmail = async (req, res) => {

  const id = req.params.id;

  // exclude uploads without an uploadUrl
  let receivedEmail = await ReceivedEmail.findById(id).lean();

  console.log(receivedEmail)

  res.render('moderator/receivedEmail', {
    title: 'Received Email',
    receivedEmail
  });

};