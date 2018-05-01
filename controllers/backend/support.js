const ReceivedEmail = require('../../models/index').ReceivedEmail

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