const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const receivedEmailSchema = new mongoose.Schema({
  toEmailAddress: String,
  fromEmailAddress: String,
  subject: String,
  text: String,
  query: String,
  date: Date,
  emailId: String,
  response: String
}, {
    timestamps: true
  });

receivedEmailSchema.virtual('timeAgo').get(function () {
  return timeAgoEnglish.format( new Date(this.createdAt) )
});


const ReceivedEmail = mongoose.model('ReceivedEmail', receivedEmailSchema);

module.exports = ReceivedEmail;


