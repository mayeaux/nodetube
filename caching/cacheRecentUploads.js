const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const View = require('../models/index').View;

const Upload = require('../models/index').Upload;

const categories = require('../config/categories');

const clone = require('clone');
const sizeof = require('object-sizeof');
const moment = require('moment');

const c = {
  l : console.log
};

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const helpers = require('../caching/helpers');

const calculateViewsByPeriod = helpers.calculateViewsByPeriod;

const buildObjects = helpers.buildObjects;

const redisClient = require('../config/redis');

const logCaching = process.env.LOG_CACHING;

async function getRecentUploads(){

  let recentUploadsAllCategories = [];

  for(const category of categories){

    if(logCaching == 'true'){
      c.l(`Getting uploads for category: ${category.name}`);
    }

    const searchQuery = {
      $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
      visibility: 'public',
      sensitive: { $ne : true },
      uploader: { $exists: true },
      category : category.name
    };

    const selectString = 'rating title views uploader fileType thumbnailUrl ' +
      'uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated category subcategory createdAt';

    let recentUploads = await Upload.find(searchQuery).select(selectString).populate('uploader reacts')
      .sort({ createdAt : - 1 })
      .limit(1000)
      .lean();

    // console.log(`${recentUploads.length} uploads found for ${category.name}`);

    recentUploadsAllCategories = recentUploadsAllCategories.concat(recentUploads);
  }

  if(logCaching == 'true'){
    c.l(`Totalling an amount of ${recentUploadsAllCategories.length} for all recent uploads`);
  }

  return recentUploadsAllCategories;
}

async function setRecentUploads(){
  let recentUploads  = await getRecentUploads();

  // calculate view periods for each upload
  recentUploads = await Promise.all(recentUploads.map(async function(upload, index){

    // get all valid views per upload
    const uploadViews = await View.find({ upload, validity: 'real' }).select('createdAt');

    upload.timeAgo = timeAgoEnglish.format( new Date(upload.createdAt) );

    // console.log(index + ' done')

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

  if(logCaching == 'true'){
    c.l(`REDIS RESPONSE FOR ${redisKey}: ${response}`);
    c.l(`${redisKey} cached`);
  }

}

module.exports = setRecentUploads;

