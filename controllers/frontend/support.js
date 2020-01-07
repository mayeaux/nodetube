const ReceivedEmail = require('../../models/index').ReceivedEmail;
const Report = require('../../models/index').Report;

const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;

exports.getReceivedEmails = async(req, res) => {

  const receivingEmailAddress = req.query.to;

  // console.log(req.query.respondedTo);

  let respondedTo = req.query.respondedTo;

  // if not true or false
  if(respondedTo !== 'false' && respondedTo !== 'true' ){
    respondedTo = 'false';
  }

  // console.log(respondedTo); // true

  // dont let users access ceo emails unless
  if(receivingEmailAddress == `ceo@${domainNameAndTLD}` && req.user.role !== 'admin'){
    return[];
  }

  // exclude uploads without an uploadUrl
  let receivedEmails = await ReceivedEmail.find({ toEmailAddress: receivingEmailAddress, respondedTo }).populate().lean();

  receivedEmails = receivedEmails.reverse();

  // console.log(receivedEmails);

  res.render('moderator/receivedEmails', {
    title: 'Received Emails',
    receivedEmails
  });
};

exports.getReceivedEmail = async(req, res) => {

  const id = req.params.id;

  // exclude uploads without an uploadUrl
  let receivedEmail = await ReceivedEmail.findById(id).lean();

  console.log(receivedEmail);

  res.render('moderator/receivedEmail', {
    title: 'Received Email',
    receivedEmail,
    email: receivedEmail
  });
};

exports.getReports = async(req, res) => {

  let reports = await Report.find({ reportingUser: { $exists: true } }).populate('reportingUser upload uploadingUser')
    .sort({createdAt: -1});

  res.render('moderator/reports', {
    title: 'Reports',
    reports
  });
};