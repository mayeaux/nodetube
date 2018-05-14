const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const View = require('../models/index').View;

const buildObjects = require('./helpers')

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




