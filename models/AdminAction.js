const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

/**
 * Allows for an audit of actions taken by admin
 */
const adminActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: ['userDeleted', 'userUndeleted', 'uploadDeleted', 'fullIpDeletion', 'banUser', 'unbanUser', 'fullUserDeletion',
      'fullUserUndeletion', 'changeUploadRating', 'untrustUser', 'trustUser', 'approveUpload', 'approveUploadAndTrustUser',
      'deleteUpload', 'deleteUploadAndBanUser']
  },
  adminOrModerator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usersAffected: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  uploadsAffected: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }],
  siteVisitorsAffected: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteVisitor'
  }],
  commentsAffected: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  note: String,
  data : {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

adminActionSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

module.exports = AdminAction;
