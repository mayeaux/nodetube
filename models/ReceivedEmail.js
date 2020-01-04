const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const receivedEmailSchema = new mongoose.Schema({
  emailId: String,
  toEmailAddress: String,
  fromEmailAddress: String,
  subject: String,
  text: String,
  sentDate: Date,
  response: String,
  respondedTo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

receivedEmailSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const ReceivedEmail = mongoose.model('ReceivedEmail', receivedEmailSchema);

module.exports = ReceivedEmail;

