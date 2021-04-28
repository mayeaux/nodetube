const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const lastWatchedTimeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload',
    index: true
  },
  uploadUniqueTag: String,
  secondsWatched: {
    type: Number
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

lastWatchedTimeSchema.index({upload: 1, user: 1}, {name: 'Last Watched Per User And Upload'});

lastWatchedTimeSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const LastWatchedTime = mongoose.model('LastWatchedTime', lastWatchedTimeSchema);

module.exports = LastWatchedTime;

