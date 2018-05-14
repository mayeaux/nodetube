const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const Upload = require('../models/index').Upload;

const clone = require('clone');
const sizeof = require('object-sizeof');

const redisClient = require('../config/redis');

let recentUploads;
async function setGlobalRecentUploads(){
  recentUploads = await redisClient.getAsync('recentUploads');
  recentUploads = JSON.parse(recentUploads);

  console.log(recentUploads)

  console.log('set recent uploads cache');
}

setGlobalRecentUploads();
setInterval(setGlobalRecentUploads, 1000 * 60 * 5);


let popularUploads;
async function setGlobalPopularUploads(){
  popularUploads = await redisClient.getAsync('popularUploads');
  popularUploads = JSON.parse(popularUploads);

  console.log('set popular uploads cache');
}

setGlobalPopularUploads();
setInterval(setGlobalPopularUploads, 1000 * 60 * 5);

const c = {
  l : console.log
};

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

function sortUploads(uploads, timeRange) {

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
async function getUploads(uploadType, timeRange, limit, offset) {
  if(!timeRange) timeRange = 'allTime';

  // load recent uploads into memory
  let uploads = recentUploads;

  console.log('getting from cache')
  console.log(uploads)

  uploads = sortUploads(uploads, timeRange);

  console.log('after sorted')

  console.log(uploads);

  // send empty array if no globalRecentUploads set
  if(!uploads) return [];

  uploads = trimUploads(uploads, limit, offset);

  return uploads;
}

module.exports = {
  getUploads
};

