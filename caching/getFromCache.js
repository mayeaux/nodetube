const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const Upload = require('../models/index').Upload;

const clone = require('clone');
const sizeof = require('object-sizeof');

const redisClient = require('../config/redis');

const categories = require('../config/categories');

const { filterUploadsBySensitivity, filterUploadsByCategory, filterUploadsBySubcategory, filterUploadsByMediaType } = require('../lib/mediaBrowsing/helpers');

let popularUploads;
async function setGlobalPopularUploads(){
  popularUploads = await redisClient.getAsync('popularUploads');
  popularUploads = JSON.parse(popularUploads);

  console.log('load popular uploads redis cache in memory ');
}

if(!process.env.FILE_HOST){
  setGlobalPopularUploads();
  setInterval(setGlobalPopularUploads, 1000 * 60 * 5);
}


let recentUploads;
async function setGlobalRecentUploads(){
  recentUploads = await redisClient.getAsync('recentUploads');
  recentUploads = JSON.parse(recentUploads);

  console.log('load recentUploads redis cache in memory ');
}

if(!process.env.FILE_HOST){
  setGlobalRecentUploads();
  setInterval(setGlobalRecentUploads, 1000 * 60 * 5);
}

// Only get needed amount of uploads
function trimUploads(uploads, limit, offset){
  // cut offset off from front of array
  let trimmedUploads = uploads.slice(offset);

  // reduce the length of array to the limit amount
  if(trimmedUploads.length > limit){
    trimmedUploads.length = limit;
  }

  return trimmedUploads
};

function sortUploadsByViews(uploads, timeRange) {

  if(timeRange == '1hour'){

    return uploads.sort(function(a, b) {
      return b.viewsWithin1hour - a.viewsWithin1hour;
    });

  } else if (timeRange == '24hour'){

    return uploads.sort(function(a, b) {
      return b.viewsWithin24hour - a.viewsWithin24hour;
    });

  } else if(timeRange == '1week'){

    return uploads.sort(function(a, b) {
      return b.viewsWithin1week - a.viewsWithin1week;
    });

  } else if(timeRange == '1month'){

    return uploads.sort(function(a, b) {
      return b.viewsWithin1month - a.viewsWithin1month;
    });

  } else if(timeRange == 'allTime'){

    return uploads.sort(function(a, b) {
      // TODO: maybe switch to all-time here
      return b.legitViewAmount - a.legitViewAmount
    });

  } else {
    console.log('SOMETHING REALLY BAD')
    console.log(timeRange)
  }
}

// upload type = popularUploads, recentUploads
async function getPopularUploads(timeRange, limit, offset,  mediaType, filter, category, subcategory) {
  // load recent uploads into memory
  let uploads = popularUploads;

  if(!uploads) return [];

  if(!timeRange) timeRange = 'allTime';

  uploads = sortUploadsByViews(uploads, timeRange);

  // send empty array if no globalRecentUploads set
  uploads = filterUploadsByMediaType(uploads, mediaType);

  uploads = filterUploadsBySensitivity(uploads, filter);

  if(category){
    if(category == 'all'){
      return uploads
    }

    uploads = filterUploadsByCategory(uploads, category);
  } else {
    // build and return overview object
    let categoryFormattedUploads = {};

    for(const category of categories){
      let categoryUploads = filterUploadsByCategory(uploads, category.name);


      categoryUploads = trimUploads(categoryUploads, limit, offset);
      categoryFormattedUploads[category.name] = categoryUploads
    }

    return categoryFormattedUploads
  }

  if(subcategory){
    uploads = filterUploadsBySubcategory(uploads, subcategory);
  }

  uploads = trimUploads(uploads, limit, offset);

  return uploads;
}

// upload type = popularUploads, recentUploads
async function getRecentUploads(limit, offset, mediaType, filter, category, subcategory) {


  // load recent uploads into memory
  let uploads = recentUploads;

  // send empty array if no globalRecentUploads set
  if(!uploads) return [];

  uploads = filterUploadsByMediaType(uploads, mediaType);

  uploads = filterUploadsBySensitivity(uploads, filter);

  if(category){

    if(category == 'all'){
      return uploads
    }

    uploads = filterUploadsByCategory(uploads, category);
  } else {
    let categoryFormattedUploads = {};

    for(const category of categories){
      let categoryUploads = filterUploadsByCategory(uploads, category.name);


      categoryUploads = trimUploads(categoryUploads, limit, offset);
      categoryFormattedUploads[category.name] = categoryUploads
    }

    return categoryFormattedUploads
  }

  if(subcategory){
    uploads = filterUploadsBySubcategory(uploads, subcategory);
  }

  uploads = trimUploads(uploads, limit, offset);

  return uploads;
}

module.exports = {
  getPopularUploads,
  getRecentUploads
};

