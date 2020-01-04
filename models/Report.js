const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const reportSchema = new mongoose.Schema({
  reportingSiteVisitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteVisit'
  },
  reportingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  },
  reason: {
    type: String,
    enum: ['copyright', 'rating', 'tos']
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

reportSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

reportSchema.index({upload: 1, reportingUser: 1}, {name: 'Report For User'});
reportSchema.index({upload: 1, reportingSiteVisitor: 1}, {name: 'Report For Site Visitor'});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;

