const mongoose = require('mongoose');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const viewSchema = new mongoose.Schema({
  siteVisitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteVisitor'
  },
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload',
    index: true
  },
  validity : {
    type: String,
    enum: ['real', 'fake']
  }
  // RATHER THAN USE VIEWED-AT TIME WE WILL USE CREATED AT TIME AS A STAND-IN
},{ timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
  autoIndex: true
});

viewSchema.virtual('timeAgo').get(function(){
  return timeAgoEnglish.format( new Date(this.createdAt) );
});

viewSchema.index({ validity: 1, createdAt: 1}, {name: 'Valid Views'});

viewSchema.index({upload: 1, validity: 1}, {name: 'Real View Count'});

viewSchema.index({upload: 1, validity: 1, createdAt: 1}, {name: 'Real View Count Within Timeframe'});

viewSchema.index({upload: 1, siteVisitor: 1, createdAt: 1}, {name: 'View Count Within Timeframe Per Site Visitor'});


const View = mongoose.model('View', viewSchema);

module.exports = View;

