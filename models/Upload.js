const mongoose = require('mongoose');
const _ = require('lodash');
const categoriesConfig = require('../config/categories');

const { getAllCategories, getAllSubcategories } = require('../lib/helpers/categories');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;

const uploadSchema = new mongoose.Schema({
  title: String,
  description: String,
  originalFileName: String,
  fileExtension: String,

  // should be in the format of https://domain.com/path, and will have the channelUrl and unique tag added in media.pug,
  // such as https://domain.com/path/$channelUrl/$uniqueTag.$fileExtension
  uploadServer: { type: String },

  // viralServer follows the same pattern as uploadServer (https://domain.com/path/) and supercedes uploadServer
  // meant to be used to send the most popular uploads to another server for bandwidth
  viralServerOn: Boolean,
  viralServer: String,

  hostUrl: String, // (backblaze prepend)  TODO: can eventually delete this

  uniqueTag: { type: String, index: true, unique: true },
  fileType: { type: String, enum: ['video', 'image', 'audio', 'unknown', 'convert'] },

  // info about original file
  originalFileSizeInMb: Number,
  processedFileSizeInMb: Number,

  // pretty sure this is in bytes
  fileSize: Number,  // TODO: should support highQualityFileSize as well for compressions

  bitrateInKbps: Number,
  dimensions: {
    height: String,
    width: String,

    // height divided by width
    aspectRatio: String
  },

  views: {
    type: Number,
    default: 0
  },
  visibility: { type: String, enum: ['public', 'unlisted', 'private', 'removed', 'pending'], default: 'public' },
  thumbnailUrl: 'String',  // TODO: can eventually delete this
  customThumbnailUrl: 'String', // TODO: can eventually delete this
  uploadUrl: 'String',
  // TODO: maybe add a value useUploadUrl to turn using uploadUrl on and off on the frontend
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  checkedViews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'View',
    default: []
  }],

  reacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'React',
    default: []
  }],

  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],

  // data from the Youtube API
  // TODO : rename to indicate it's the youtube api
  youTubeData: mongoose.Schema.Types.Mixed,

  // data from youtubeDL
  youTubeDLData: mongoose.Schema.Types.Mixed,

  // TODO: this should be an enum
  status: String,
  sensitive: {
    type: Boolean,
    default: false
  },

  rating: { type: String, enum: ['allAges', 'mature', 'sensitive'] },

  thumbnails: {
    generated: 'String',
    custom: 'String',
    medium: 'String',
    large: 'String'
  },

  quality: {
    high: Number
  },

  livestreamDate: {
    type: String
  },

  uncurated: {
    type: Boolean
  },

  moderated: {
    type: Boolean
  },

  category: {
    type: String,
    default: 'uncategorized',
    enum: getAllCategories()
  },

  subcategory: { type: String, enum: getAllSubcategories() },

  durationInSeconds: Number,
  formattedDuration: String,

  processingCompletedAt: Date,

  // string, such as UnIqUe.webvtt used by default to indicate it's in the same directory with the upload
  webVTTPath: String,

  ffprobeData: mongoose.Schema.Types.Mixed

}, {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
  autoIndex: false
});

const oneHourAmount =  1000 * 60 * 60;
const oneDayAmount =  1000 * 60 * 60 * 24;

uploadSchema.virtual('uploadServerUrl').get(function(){

  let uploadServerUrl;

  if(process.env.NODE_ENV == 'development'){
    uploadServerUrl = '/uploads';
  } else {
    uploadServerUrl = `https://${this.uploadServer}.${domainNameAndTLD}`;
  }

  return uploadServerUrl;
});

uploadSchema.virtual('thumbnail').get(function(){

  // order of importance: custom, then generated, then medium
  const thumbnail =  this.thumbnails.custom ||  this.thumbnails.generated ||  this.thumbnails.medium;

  return thumbnail;
});

uploadSchema.virtual('lessThan1hOld').get(function(){

  const timeDiff = new Date() - this.createdAt;
  const timeDiffInH = timeDiff / oneHourAmount;

  return timeDiffInH > 1;
});

uploadSchema.virtual('lessThan24hOld').get(function(){

  const timeDiff = new Date() - this.createdAt;
  const timeDiffInH = timeDiff / oneHourAmount;

  return timeDiffInH > 24;
});

uploadSchema.virtual('lessThan24hOld').get(function(){

  const timeDiff = new Date() - this.createdAt;
  const timeDiffInH = timeDiff / oneHourAmount;

  return timeDiffInH > 24;
});

// TODO: eventually this can be simplified because we won't support createdAt anymore
// can also be simplified in caching
uploadSchema.virtual('timeAgo').get(function(){

  return timeAgoEnglish.format( new Date(this.processingCompletedAt || this.createdAt) );
});

uploadSchema.virtual('viewsWithin1hour').get(function(){

  let realViews = _.filter(this.checkedViews, function(view){
    return view.validity == 'real' && view.createdAt > ( new Date() - oneHourAmount );
  });

  return realViews.length;
});

uploadSchema.virtual('viewsWithin24hour').get(function(){

  let realViews = _.filter(this.checkedViews, function(view){
    return view.validity == 'real' && view.createdAt > ( new Date() - oneDayAmount );
  });

  return realViews.length;
});

uploadSchema.virtual('viewsWithin1week').get(function(){

  let realViews = _.filter(this.checkedViews, function(view){
    return view.validity == 'real' && view.createdAt > ( new Date() - oneDayAmount * 7 );
  });

  return realViews.length;
});

uploadSchema.virtual('viewsWithin1month').get(function(){

  let realViews = _.filter(this.checkedViews, function(view){
    return view.validity == 'real';
  });

  return realViews.length;
});

uploadSchema.virtual('viewsAllTime').get(function(){

  let realViews = _.filter(this.checkedViews, function(view){
    return view.validity == 'real' && ( new Date() - oneDayAmount * 365 );
  });

  return realViews.length;
});

uploadSchema.virtual('legitViewAmount').get(function(){

  const realViews = _.filter(this.checkedViews, function(view){
    return view.validity == 'real';
  });

  let legitViews = this.views + realViews.length;

  /** CAP TO 300 WITHIN HOUR **/
  const timeDiff = new Date() - this.createdAt;
  const timeDiffInH = timeDiff / ( 1000 * 60 * 60);

  // cap views to 300
  if(timeDiffInH < 24 && legitViews > 300){
    return 300;
  }

  return legitViews;
});

uploadSchema.index({sensitive: 1, visibility: 1, status: 1, createdAt: -1, category: 1}, {name: 'All Media List'});
uploadSchema.index({sensitive: 1, visibility: 1, status: 1, fileType: 1, createdAt: -1}, {name: 'File Type List'});
uploadSchema.index({uploader: 1, visibility: 1, status: 1, createdAt: -1}, {name: 'Subscription Uploads'});
uploadSchema.index({uploader: 1, title: 1}, {name: 'Upload Check'});
uploadSchema.index({visibility: 1, status: 1}, {name: 'Random Upload'});

const Upload = mongoose.model('Upload', uploadSchema);

module.exports = Upload;
