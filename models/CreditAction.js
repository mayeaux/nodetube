const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

/**
 * TODO: Fix this
 */
const creditActionSchema = new mongoose.Schema({
  sendingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivingUserInitialCredit: {
    type: Number
  },
  sendingUserInitialCredit: {
    type: Number
  },
  receivingUserFinalCredit: {
    type: Number
  },
  sendingUserFinalCredit: {
    type: Number
  },
  // amount in cents
  amount: {
    type: Number
  },
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }
}, { timestamps: true });

creditActionSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const CreditAction = mongoose.model('CreditAction', creditActionSchema);

module.exports = CreditAction;
