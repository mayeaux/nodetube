const _ = require('lodash');
const moment = require('moment');

function buildObjects(uploads){
  return uploads.map(function(upload){
    upload = {
      uploader : {
        channelName: upload.uploader.channelName,
        channelUrl: upload.uploader.channelUrl,
        verified: upload.uploader.verified,
        plan: upload.uploader.plan,
        _id: upload.uploader._id,
        curated: upload.uploader.curated
      },
      _id: upload._id,
      createdAt: upload.createdAt,
      title: upload.title,
      fileType: upload.fileType,
      fileExtension: upload.fileExtension,
      uniqueTag: upload.uniqueTag,
      uploadUrl: upload.uploadUrl,
      timeAgo: upload.timeAgo,
      viewsWithin1hour: upload.viewsWithin1hour,
      viewsWithin24hour: upload.viewsWithin24hour,
      viewsWithin1week: upload.viewsWithin1week,
      viewsWithin1month: upload.viewsWithin1month,
      viewsAllTime: upload.viewsAllTime,
      category: upload.category,
      description: upload.description,

      // TODO: no capping currently
      legitViewAmount: upload.viewsAllTime,

      thumbnailUrl: upload.thumbnailUrl,
      customThumbnailUrl: upload.customThumbnailUrl,
      thumbnails: upload.thumbnails,
      rating: upload.rating,
      reacts: upload.reacts,

      formattedDuration: upload.formattedDuration

    };

    return upload;
  });
}

// build dates
var monthAgo =  moment().subtract(30, 'days').toDate();
var weekAgo =  moment().subtract(7, 'days').toDate();
var dayAgo = moment().subtract(24, 'hours').toDate();
var hourAgo = moment().subtract(1, 'hours').toDate();
var minuteAgo = moment().subtract(1, 'minutes').toDate();

function calculateViewsByPeriod(upload, uploadViews){
  upload.viewsAllTime = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > monthAgo; });
  upload.viewsWithin1month = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > weekAgo; });
  upload.viewsWithin1week = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > dayAgo; });
  upload.viewsWithin24hour = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > hourAgo; });
  upload.viewsWithin1hour = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > minuteAgo; });
  upload.viewsWithin1minute = uploadViews.length;

  return upload;
}

module.exports = {
  calculateViewsByPeriod,
  buildObjects
};
