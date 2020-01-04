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

const helpers = require('../caching/helpers');

const calculateViewsByPeriod = helpers.calculateViewsByPeriod;

const buildObjects = helpers.buildObjects;

// find the views

const logCaching = process.env.LOG_CACHING;

async function getPopularUploads(){

  if(logCaching == 'true'){
    c.l('Getting popular uploads');
  }

  // TODO: have to have a job to update upload's view amounts
  // TODO: have to build 4 arrays of ~1000

  const searchQuery = {
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    uploader: { $exists: true },
    category : { $exists: true }
  };

  const selectString = 'rating title views checkedViews uploader fileType thumbnailUrl ' +
    'uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated category subcategory';

  let popularUploads = await Upload.find(searchQuery).select(selectString).populate('uploader reacts')
    .lean();

  if(logCaching == 'true'){
    c.l('Uploads received from database');

    c.l(popularUploads.length);
  }

  return popularUploads;
}

async function setPopularUploads(){
  let popularUploads  = await getPopularUploads();

  // do more stringent check for uploader
  popularUploads =  _.filter(popularUploads, function(upload){
    return upload.uploader;
  });

  // calculate view periods for each upload
  popularUploads = await Promise.all(popularUploads.map(async function(upload){

    // get all valid views per upload
    const uploadViews = await View.find({ upload, validity: 'real' }).select('createdAt');

    // calculate their views per period (last24h, lastweek)
    return calculateViewsByPeriod(upload, uploadViews);
  }));

  if(logCaching == 'true'){
    c.l('Popular uploads have been calculated according to view periods');
  }

  // build json objects representing uploads
  popularUploads = buildObjects(popularUploads);

  if(logCaching == 'true'){
    c.l('Popular uploads objects have been built');
  }

  const redisKey = 'popularUploads';
  const response = await redisClient.setAsync(redisKey, JSON.stringify(popularUploads));

  if(logCaching == 'true'){
    c.l(`REDIS RESPONSE FOR ${redisKey}: ${response}`);

    c.l(`${redisKey} cached`);

  }
}

module.exports = setPopularUploads;

