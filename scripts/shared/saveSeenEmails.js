var MailListener = require('mail-listener2');

const dotenv = require('dotenv');
const mongoose = require('mongoose');

const ReceivedEmail = require('../../models').ReceivedEmail;

/** connect to MongoDB **/
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.Promise = global.Promise;

mongoose.Promise = global.Promise;
mongoose.connect(mongoUri, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true
});

// mongoose.set('debug', true);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

console.log('Connected to ' + mongoUri);

// have to run from project directory to work
dotenv.load({ path: '.env.private' });
dotenv.load({ path: '.env.settings' });

const imapUsername = process.env.EMAIL_ADDRESS;
const imapPassword = process.env.NODETUBE_VERIFY_EMAIL_PASSWORD;
const imapHost = process.env.EMAIL_HOST;
const imapPort = process.env.EMAIL_PORT;

console.log(imapPassword, imapUsername, imapHost);

var mailListener = new MailListener({
  username: imapUsername,
  password: imapPassword,
  host: imapHost,
  port: imapPort,
  tls: true,
  connTimeout: 10000, // Default by node-imap
  // debug: console.log, // Or your custom function with only one incoming argument. Default: null
  tlsOptions: { rejectUnauthorized: false },
  mailbox: 'INBOX', // mailbox to monitor
  searchFilter: ['SEEN'], // the search filter being used after an IDLE notification has been retrieved
  // markSeen: true, // all fetched email will be marked as seen and not fetched next time
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
  mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
  attachments: true, // download attachments as they are encountered to the project directory
  attachmentOptions: { directory: 'attachments/' } // specify a download directory for attachments
});

mailListener.start(); // start listening

// stop listening
// mailListener.stop();

mailListener.on('server:connected', function(){
  console.log('imapConnected');

});

mailListener.on('server:disconnected', function(){
  console.log('imapDisconnected');
});

mailListener.on('error', function(err){
  console.log(err);
});

(async function(){

  const existingEmails = await ReceivedEmail.find({});

  const emailIds = existingEmails.map(function(email){
    return email.emailId;
  });

  // seqno just an incrementing index
  mailListener.on('mail', async function(mail, seqno, attributes){

    // console.log(attributes);

    // /** data collected **/
    // console.log('from: ' + mail.from[0].address);
    // console.log('to: ' + mail.to[0].address);
    // console.log(mail.date);
    // console.log(mail['messageId']);
    // console.log(mail.subject);
    // console.log('\n');

    const fromEmailAddress = mail.from[0].address;
    const subject = mail.subject;
    const emailId = mail.messageId;
    const text = mail.text;
    const sentDate = mail.date;

    if(emailIds.includes(emailId)){
      console.log('Already done, skipping ' + sentDate);
      return;
    } else {
      console.log('Not downloaded yet, saving now');
    }

    const emailObject = {
      emailId,
      toEmailAddress: imapUsername,
      fromEmailAddress,
      subject,
      text,
      sentDate
    };

    const email = new ReceivedEmail(emailObject);

    await email.save();

    console.log('Email saved');

    // toEmailAddress: String,
    //   fromEmailAddress: String,
    //   subject: String,
    //   text: String,
    //   date: Date,
    //   emailId: String,
    //   response: String

    // console.log(mail.priority);
    // console.log(mail.eml);
    // console.log(mail.text)

    // console.log(mail.headers['message-id']);

    const keys = Object.keys(mail.headers);

    // console.log(keys);
    // console.log(mail.eml)

    /** MAIL KEYS **/
    // 'text',
    // 'headers',
    // 'subject',
    // 'messageId',
    // 'priority',
    // 'from',
    // 'to',
    // 'date',
    // 'receivedDate',
    // 'eml' ]

    /** HEADERS **/
    // [ 'from',
    // 'message-id',
    // 'subject',
    // 'mime-version',
    // 'content-type',
    // 'x-priority',
    // 'user-agent',
    // 'x-mailer',
    // 'x-zoho-virus-status',
    // 'to',
    // 'date',
    // 'in-reply-to',
    // 'x-zohomail-sender' ]

    /** EXAMPLE ATTRIBUTE **/
    // { date: 2017-09-22T17:03:05.000Z,
    //   flags: [ '\\Recent', '\\Seen', 'NONJUNK' ],
    //   uid: 7,
    //   modseq: '1000000000000000000' }

    // do something with mail object including attachments
    // console.log("emailParsed", mail);
    // mail processing code goes here
  });

  // mailListener.imap.move(:msguids, :mailboxes, function(){})

})();

