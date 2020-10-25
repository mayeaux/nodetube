const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

// FIND USERS WITH ACTIVE EMAIL SUBSCRIPTIONS, GET THEIR EMAIL AND EMAIL THEM

const emailSubscriptionSchema = new mongoose.Schema({
  subscribingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  subscribedToUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  drivingUpload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  },
  active: {
    type: Boolean
  }
  // RATHER THAN USE VIEWED-AT TIME WE WILL USE CREATED AT TIME AS A STAND-IN
},{ timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

emailSubscriptionSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const EmailSubscription = mongoose.model('emailSubscription', emailSubscriptionSchema);

module.exports = EmailSubscription;

