const ReceivedEmail = require('../../models/index').ReceivedEmail;
const supportLib = require('../../lib/support/email.js');

exports.sendResponse = async(req, res) => {

  try {

    const response = req.body.response;

    const id = req.params.id;

    // exclude uploads without an uploadUrl
    let receivedEmail = await ReceivedEmail.findById(id);

    if(receivedEmail.response){
      throw new Error('Already has a response');
    }

    receivedEmail.response = response;

    await receivedEmail.save();

    console.log(receivedEmail);

    res.send('success');

  } catch(err){
    console.log(err);
    res.send('err');
  }

};

exports.sendEmail = async(req, res) => {

  try {

    const emailId = req.params.id;

    // console.log(req.params.id);
    //
    // const emailId = "5ae7ad6e8fc862007ee331cd";

    let receivedEmail = await ReceivedEmail.findById(emailId);

    if(!receivedEmail.response){
      throw new Error('No response written yet');
    }

    // console.log(receivedEmail)

    const response = await supportLib.sendEmailResponse(receivedEmail);

    console.log(response);

    receivedEmail.respondedTo = true;

    await receivedEmail.save();

    res.send('success');

  } catch(err){
    console.log(err);
    res.send('err');
  }
};