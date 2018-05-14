const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const View = require('../models/index').View;

const Upload = require('../models/index').Upload;

const clone = require('clone');
const sizeof = require('object-sizeof');
const moment = require('moment');

const c = {
  l : console.log
};

const redisClient = require('../config/redis');

// build dates
var monthAgo =  moment().subtract(30, 'days').toDate();
var weekAgo =  moment().subtract(7, 'days').toDate();
var dayAgo = moment().subtract(24, 'hours').toDate();
var hourAgo = moment().subtract(1, 'hours').toDate();
var minuteAgo = moment().subtract(1, 'minutes').toDate();

// find the views


async function calculateViewsByPeriod(upload, uploadViews){
  upload.viewsAllTime = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > monthAgo });
  upload.viewsWithin1month = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > weekAgo });
  upload.viewsWithin1week = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > dayAgo });
  upload.viewsWithin24hour = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > hourAgo });
  upload.viewsWithin1hour = uploadViews.length;

  uploadViews = _.filter(uploadViews, function(uploadView){ return uploadView.createdAt > minuteAgo });
  upload.viewsWithin1minute = uploadViews.length;

  return upload
}


async function getRecentUploads(){

  console.log('Getting recent uploads');

  const searchQuery = {
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    uploader: { $exists: true },
    category : { $exists: true }
  };

  const selectString = 'rating title views checkedViews uploader fileType thumbnailUrl ' +
    'uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated';

  let recentUploads = await Upload.find(searchQuery).select(selectString).populate('uploader reacts')
    .limit(1)
    .lean();

  console.log('Uploads received from database');

  c.l(recentUploads.length);

  return recentUploads
}

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

      // TODO: no capping currently
      legitViewAmount: upload.viewsAllTime,

      thumbnailUrl: upload.thumbnailUrl,
      customThumbnailUrl: upload.customThumbnailUrl,
      thumbnails: upload.thumbnails,
      rating: upload.rating,
      reacts: upload.reacts

    };

    return upload
  })
}

async function setRecentUploads() {
  console.log('Caching recent uploads');

  let recentUploads  = await getRecentUploads();

  console.log('DB returned, calculating view amounts');

  // do more stringent check for uploader
  recentUploads =  _.filter(recentUploads, function(upload){
    return upload.uploader;
  });

  // calculate view periods for each upload
  recentUploads = await Promise.all(recentUploads.map(async function(upload){

    // get all valid views per upload
    const uploadViews = await View.find({ upload, validity: 'real' }).select('createdAt');

    // calculate their views per period (last24h, lastweek)
    return calculateViewsByPeriod(upload, uploadViews);
  }));

  console.log(recentUploads);

  console.log('View amounts calculated, building objects');

  recentUploads = buildObjects(recentUploads);

  console.log('Done Setting');

  console.log(recentUploads);

  console.log(recentUploads.length)

  const redisKey = 'recentUploads';

  const response = await redisClient.setAsync(redisKey, JSON.stringify(recentUploads));

  console.log(`REDIS RESPONSE FOR ${redisKey}: ${response}`);

  console.log(`${redisKey} cached`);
}

module.exports = setRecentUploads;




