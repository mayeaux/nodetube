const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

/**
 * TODO: Fix this
 */
const commentSchema = new mongoose.Schema({
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload',
    index: true
  },
  inResponseTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  responses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  text: String,
  visibility: {
    type: String,
    enum: ['public', 'removed', 'spam'],
    default: 'public',
    index: true
  }
}, { timestamps: true });

commentSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
