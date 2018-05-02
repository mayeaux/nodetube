const ReceivedEmail = require('../../models/index').ReceivedEmail;
const supportLib = require('../../lib/support/email');

exports.sendResponse = async (req, res) => {

  const response = req.body.response;

  const id = req.params.id;

  // exclude uploads without an uploadUrl
  let receivedEmail = await ReceivedEmail.findById(id);

  receivedEmail.response = response;

  await receivedEmail.save();

  console.log(receivedEmail);

  res.send('success')

};

exports.sendEmail = async (req, res) => {

  const emailId = "5ae7ad6e8fc862007ee331cd";

  const receivedEmail = await ReceivedEmail.findById(emailId);

  const response = await supportLib.sendEmail(receivedEmail);

  console.log(response);

  res.send('success"0;')
};