const Promise = require('bluebird');
const _ = require('lodash');
const View = require('../models/index').View;
const Upload = require('../models/index').Upload;
const categories = require('../config/categories');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const helpers = require('../caching/helpers');

const buildObjects = helpers.buildObjects;

const redisClient = require('../config/redis');

const logCaching = process.env.LOG_CACHING;

/** Get all recent uploads from the database per category and concat them **/
async function getRecentUploads(){

  let recentUploadsAllCategories = [];

  for(const category of categories){

    if(logCaching == 'true'){
      console.log(`Getting uploads for category: ${category.name}`);
    }

    const searchQuery = {
      $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
      visibility: 'public',
      sensitive: { $ne : true },
      uploader: { $exists: true },
      category : category.name
    };

    const selectString = 'rating title views uploader fileType thumbnailUrl ' +
      'uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated category subcategory createdAt description processingCompletedAt';

    let recentUploads = await Upload.find(searchQuery).select(selectString).populate('uploader reacts')
      .sort({ createdAt : - 1 })
      .limit(1000)
      .lean();

    // console.log(`${recentUploads.length} uploads found for ${category.name}`);

    recentUploadsAllCategories = recentUploadsAllCategories.concat(recentUploads);
  }

  if(logCaching == 'true'){
    console.log(`Totalling an amount of ${recentUploadsAllCategories.length} for all recent uploads`);
  }

  return recentUploadsAllCategories;
}

/** Get recent uploads per the function above, calculate their views per time period **/
async function setRecentUploads(){
  let recentUploads  = await getRecentUploads();

  // calculate view periods for each upload
  recentUploads = await Promise.all(recentUploads.map(async function(upload){

    // console.log(upload.uniqueTag);

    // console.log(`view amount ${upload.viewAmount}`);

    upload.timeAgo = timeAgoEnglish.format( new Date(upload.processingCompletedAt || upload.createdAt) );

    upload.viewsAllTime = await View.find({
      upload: upload._id
    }).countDocuments();

    return upload;

    // console.log(index + ' done')

    // calculate their views per period (last24h, lastweek)
  }));

  // build json objects representing uploads
  recentUploads = buildObjects(recentUploads);

  const redisKey = 'recentUploads';
  const response = await redisClient.setAsync(redisKey, JSON.stringify(recentUploads));

  if(logCaching == 'true'){
    console.log(`REDIS RESPONSE FOR ${redisKey}: ${response}`);
    console.log(`${redisKey} cached`);
  }

}

module.exports = setRecentUploads;

