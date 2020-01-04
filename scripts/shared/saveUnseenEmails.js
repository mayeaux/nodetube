var MailListener = require('mail-listener2');

const dotenv = require('dotenv');

const ReceivedEmail = require('../../models').ReceivedEmail;

// have to run from project directory to work
dotenv.load({ path: '.env.private' });
dotenv.load({ path: '.env.settings' });

let mailListenerSettings = {
  tls: true,
  connTimeout: 10000, // Default by node-imap
  // debug: console.log, // Or your custom function with only one incoming argument. Default: null
  tlsOptions: { rejectUnauthorized: false },
  mailbox: 'INBOX', // mailbox to monitor
  markSeen: true, // all fetched email will be marked as seen and not fetched next time
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
  mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
  attachments: true, // download attachments as they are encountered to the project directory
  attachmentOptions: { directory: 'attachments/' } // specify a download directory for attachments
};

/** whether or not you should save seen as well**/
let saveSeen = process.env.SAVE_SEEN_EMAILS || true;
if(saveSeen){
  mailListenerSettings.searchFilter = ['SEEN']; // the search filter being used after an IDLE notification has been retrieved
}

const copyrightEmailCredentials = {
  username: process.env.COPYRIGHT_EMAIL_ADDRESS,
  password: process.env.COPYRIGHT_EMAIL_PASSWORD,
  host: process.env.COPYRIGHT_EMAIL_IMAP_HOST,
  port: process.env.COPYRIGHT_EMAIL_IMAP_PORT
};

const supportEmailCredentials = {
  username: process.env.SUPPORT_EMAIL_ADDRESS,
  password: process.env.SUPPORT_EMAIL_PASSWORD,
  host: process.env.SUPPORT_EMAIL_IMAP_HOST,
  port: process.env.SUPPORT_EMAIL_IMAP_PORT
};

let mailListeners = [];

(async function(){

  const existingEmails = await ReceivedEmail.find({});

  const emailIds = existingEmails.map(function(email){
    return email.emailId;
  });

  var copyrightEmailListener = new MailListener(Object.assign(copyrightEmailCredentials, mailListenerSettings));

  var supportEmailListener = new MailListener(Object.assign(supportEmailCredentials, mailListenerSettings));

  const copyrightEmailObject = {
    email: process.env.COPYRIGHT_EMAIL_ADDRESS,
    listener: copyrightEmailListener
  };

  const supportEmailObject = {
    email: process.env.SUPPORT_EMAIL_ADDRESS,
    listener: supportEmailListener
  };

  mailListeners.push(copyrightEmailObject);

  mailListeners.push(supportEmailObject);

  for(const emailObject of mailListeners){

    mailListener = emailObject.listener;

    const toEmailAddress = emailObject.email;

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

    // seqno just an incrementing index
    mailListener.on('mail', async function(mail, seqno, attributes){

      const fromEmailAddress = mail.from[0].address;
      const subject = mail.subject;
      const emailId = mail.messageId;
      const text = mail.text;
      const sentDate = mail.date;

      if(emailIds.includes(emailId)){
        console.log('Already done, skipping');
        return;
      } else {
        console.log('Not downloaded yet, saving now');
      }

      const emailObject = {
        emailId,
        toEmailAddress,
        fromEmailAddress,
        subject,
        text,
        sentDate
      };

      const email = new ReceivedEmail(emailObject);

      await email.save();

      console.log('Email saved');

    });
  }

}());

