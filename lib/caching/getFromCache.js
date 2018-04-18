const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;

const clone = require('clone');
const sizeof = require('object-sizeof');


const c = {
  l : console.log
};

const redisClient = require('../../config/redis');

// Only get needed amount of uploads
function trimUploads(localUploads, limit, offset){
  // cut offset off from front of array
  let trimmedUploads = localUploads.slice(offset);

  // reduce the length of array to the limit amount
  if(trimmedUploads.length > limit){
    trimmedUploads.length = limit;
  }

  return trimmedUploads
};




function trimChannels(localChannels, limit, offset){
  // cut offset off from front of array
  let trimmedChannels = localChannels.slice(offset);

  // reduce the length of array to the limit amount
  if(trimmedChannels.length > limit){
    trimmedChannels.length = limit;
  }

  return trimmedChannels
};

let globalChannels;
async function setGlobalChannels(){
  globalChannels = await redisClient.getAsync('channels');
  globalChannels = JSON.parse(globalChannels);

  console.log('got channels cache');
}

let globalUploads;
async function setGlobalUploads(){
  globalUploads = await redisClient.getAsync('uploads');
  globalUploads = JSON.parse(globalUploads);

  console.log('got uploads cache');
}

setGlobalChannels();
setGlobalUploads();

setInterval(setGlobalChannels, 1000 * 60 * 5);
setInterval(setGlobalUploads, 1000 * 60 * 5);

async function getChannels(timeRange, limit, offset, rating){
  let localChannels = globalChannels

  if(!localChannels){

    // console.log(localUploads.length);

    return [];
  }


  if(!timeRange) timeRange = 'alltime';


  if(timeRange !== 'alltime'){

    if(timeRange == '1month'){
      localChannels = localChannels.sort(function(a, b) {
        return b.totalViewsWithin1month - a.totalViewsWithin1month;
      });

      localChannels = trimChannels(localChannels, limit, offset)

      return localChannels

    } else if (timeRange == '1week'){

      localChannels = localChannels.sort(function(a, b) {
        return b.totalViewsWithin1week - a.totalViewsWithin1week;
      });

      localChannels = trimChannels(localChannels, limit, offset);

      return localChannels

    } else if (timeRange == '24hour'){

      localChannels = localChannels.sort(function(a, b) {
        return b.totalViewsWithin24hour - a.totalViewsWithin24hour;
      });

      localChannels = trimChannels(localChannels, limit, offset);

      return localChannels

    }
  } else {

    localChannels = localChannels.sort(function(a, b) {
      return b.totalViews - a.totalViews;
    });

    localChannels = trimChannels(localChannels, limit, offset);

    return localChannels
  }


}

async function getUploads(timeRange, limit, offset){
  if(!timeRange) timeRange = 'alltime';

  // console.log(timeRange);

  var localUploads = globalUploads

  console.log(localUploads.length)
  c.l('length')

  if(!localUploads){

    // console.log(localUploads.length);

    return [];
  }

  if(timeRange !== 'alltime'){

    if(timeRange == '1month'){
      localUploads = localUploads.sort(function(a, b) {
        return b.viewsWithin1month - a.viewsWithin1month;
      });

      localUploads = trimUploads(localUploads, limit, offset);

      return localUploads

    } else if (timeRange == '1week'){

      localUploads = localUploads.sort(function(a, b) {
        return b.viewsWithin1week - a.viewsWithin1week;
      });

      localUploads = trimUploads(localUploads, limit, offset);

      return localUploads

    } else if (timeRange == '24hour'){

      localUploads = localUploads.sort(function(a, b) {
        return b.viewsWithin24hour - a.viewsWithin24hour;
      });

      localUploads = trimUploads(localUploads, limit, offset);

      return localUploads

    } else if (timeRange == '1hour'){

      localUploads = localUploads.sort(function(a, b) {
        return b.viewsWithin1hour - a.viewsWithin1hour;
      });

      localUploads = trimUploads(localUploads, limit, offset);

      return localUploads

    }


  } else {

    localUploads = localUploads.sort(function(a, b) {
      return b.legitViewAmount - a.legitViewAmount;
    });

    localUploads = trimUploads(localUploads, limit, offset);

    return localUploads
  }


}





module.exports = {
  getChannels,
  getUploads
};

