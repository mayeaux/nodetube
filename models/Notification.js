const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const notificationSchema = new mongoose.Schema({
  // TODO: Would prefer 'notifiedUser'
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // TODO: Would prefer 'sendingUser'
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // TODO: Would prefer 'type'
  action: {
    type: String,
    enum: ['comment', 'react', 'subscription', 'message']
  },
  read: {
    type: Boolean,
    default: false
  },

  text: String,

  // upload document for notification
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  },
  // react document for notification
  react: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'React'
  },
  // comment document for notification
  comment : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  // subscription document for notification
  subscription : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  }

},{ timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

notificationSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

notificationSchema.index({user: 1, createdAt: -1}, {name: 'User Notifications'});
notificationSchema.index({user: 1, read: 1, createdAt: -1}, {name: 'Read User Notifications'});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

