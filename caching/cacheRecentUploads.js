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

async function getRecentUploads(uploadType){

  console.log(`Getting recent uploads`);

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
    .limit(2500)
    .sort({ createdAt : - 1 })
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
  let recentUploads  = await getRecentUploads();

  // do more stringent check for uploader
  recentUploads =  _.filter(recentUploads, function(upload){
    return upload.uploader;
  });


  // build json objects representing uploads
  recentUploads = buildObjects(recentUploads);

  const redisKey = 'recentUploads';
  const response = await redisClient.setAsync(redisKey, JSON.stringify(recentUploads));

  console.log(`REDIS RESPONSE FOR ${redisKey}: ${response}`);

  console.log(`${redisKey} cached`);
}

module.exports = setRecentUploads;




