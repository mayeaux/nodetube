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

const helpers = require('../caching/helpers');

const calculateViewsByPeriod = helpers.calculateViewsByPeriod;

const buildObjects = helpers.buildObjects;

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
    'uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated category subcategory';

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

  // calculate view periods for each upload
  recentUploads = await Promise.all(recentUploads.map(async function(upload){

    // get all valid views per upload
    const uploadViews = await View.find({ upload, validity: 'real' }).select('createdAt');

    // calculate their views per period (last24h, lastweek)
    return calculateViewsByPeriod(upload, uploadViews);
  }));

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




