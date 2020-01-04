const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const socialPostSchema = new mongoose.Schema({
  postData: [{
    message: String,
    network : String,
    postedCorrectly : Boolean,
    postedTime : Date,
    distance: String
  }],
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  },
  message : String,
  finished: {
    type: Boolean,
    default: false
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

socialPostSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

module.exports = SocialPost;

