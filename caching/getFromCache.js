const redisClient = require('../config/redis');

const categories = require('../config/categories');

const logCaching = process.env.LOG_CACHING;

const { filterUploadsBySensitivity, filterUploadsByCategory, filterUploadsBySubcategory, filterUploadsByMediaType } = require('../lib/mediaBrowsing/helpers');

// set these globally as they will store the data returned in memory
let popularUploads;
let recentUploads;

async function setGlobalPopularUploads(){
  popularUploads = await redisClient.getAsync('popularUploads');
  popularUploads = JSON.parse(popularUploads);

  if(logCaching == 'true'){
    console.log('load popular uploads redis cache in memory ');
  }

}

if(!process.env.FILE_HOST || process.env.FILE_HOST == 'false' || process.env.GET_CACHE == 'true'){
  if(logCaching == 'true'){
    console.log('not running as a file host, get from cache ');
  }
  setGlobalPopularUploads();
  setInterval(setGlobalPopularUploads, 1000 * 60 * 5);
}

async function setGlobalRecentUploads(){
  recentUploads = await redisClient.getAsync('recentUploads');
  recentUploads = JSON.parse(recentUploads);

  if(logCaching == 'true'){
    console.log('load recentUploads redis cache in memory ');
  }
}

// set global uploads if the service is not a FILE_HOST
if(!process.env.FILE_HOST || process.env.FILE_HOST == 'false' || process.env.GET_CACHE == 'true'){
  setGlobalRecentUploads();
  // setInterval(setGlobalRecentUploads, 1000 * 60 * 5);
  setInterval(setGlobalRecentUploads, 1000 * 30);
}

// Only get needed amount of uploads
function trimUploads(uploads, limit, offset){
  // cut offset off from front of array
  let trimmedUploads = uploads.slice(offset);

  // reduce the length of array to the limit amount
  if(trimmedUploads.length > limit){
    trimmedUploads.length = limit;
  }

  return trimmedUploads;
}

function sortUploadsByViews(uploads, timeRange){

  if(timeRange == '1hour'){

    return uploads.sort(function(a, b){
      return b.viewsWithin1hour - a.viewsWithin1hour;
    });

  } else if(timeRange == '24hour'){

    return uploads.sort(function(a, b){
      return b.viewsWithin24hour - a.viewsWithin24hour;
    });

  } else if(timeRange == '1week'){

    return uploads.sort(function(a, b){
      return b.viewsWithin1week - a.viewsWithin1week;
    });

  } else if(timeRange == '1month'){

    return uploads.sort(function(a, b){
      return b.viewsWithin1month - a.viewsWithin1month;
    });

  } else if(timeRange == 'allTime' || timeRange == 'alltime'){

    return uploads.sort(function(a, b){
      // TODO: maybe switch to all-time here
      return b.legitViewAmount - a.legitViewAmount;
    });

  } else {
    console.log('SOMETHING REALLY BAD');
    console.log(timeRange);
  }
}

// upload type = popularUploads, recentUploads
async function getPopularUploads(timeRange, limit, offset,  mediaType, filter, category, subcategory){
  // load recent uploads into memory
  let uploads = popularUploads;

  // if category is overview act like no category is given (triggers category frontend)
  if(category == 'overview'){
    category = '';
  }

  if(!uploads)return[];

  if(!timeRange) timeRange = 'allTime';

  uploads = sortUploadsByViews(uploads, timeRange);

  // send empty array if no globalRecentUploads set
  uploads = filterUploadsByMediaType(uploads, mediaType);

  uploads = filterUploadsBySensitivity(uploads, filter);

  if(category){
    if(category == 'all'){
      uploads = trimUploads(uploads, limit, offset);
      uploads[category.name] = 'all';

      return uploads;
    }

    uploads = filterUploadsByCategory(uploads, category);
  } else {
    // build and return overview object
    let categoryFormattedUploads = {};

    for(const category of categories){
      let categoryUploads = filterUploadsByCategory(uploads, category.name);

      categoryUploads = trimUploads(categoryUploads, limit, offset);
      categoryFormattedUploads[category.name] = categoryUploads;
    }

    return categoryFormattedUploads;
  }

  if(subcategory){
    uploads = filterUploadsBySubcategory(uploads, subcategory);
  }

  uploads = trimUploads(uploads, limit, offset);

  return uploads;
}

// upload type = popularUploads, recentUploads
async function getRecentUploads(limit, offset, mediaType, filter, category, subcategory){

  // load recent uploads into memory
  let uploads = recentUploads;

  // send empty array if no globalRecentUploads set
  if(!uploads)return[];

  uploads = filterUploadsByMediaType(uploads, mediaType);

  uploads = filterUploadsBySensitivity(uploads, filter);

  // if category is overview act like no category is given (triggers category frontend)
  if(category == 'overview'){
    category = '';
  }

  if(category){

    if(category == 'all'){

      // sort all by createdAt dates (most recent to least recent)
      uploads = uploads.sort(function(a, b){
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      uploads = trimUploads(uploads, limit, offset);
      uploads[category.name] = 'all';

      return uploads;
    }

    uploads = filterUploadsByCategory(uploads, category);

    // IF THERE IS NO CATEGORY
  } else {

    // BUILDING THE CATEGORY OVERVIEW  OBJECT
    let categoryFormattedUploads = {};

    for(const category of categories){
      let categoryUploads = filterUploadsByCategory(uploads, category.name);

      categoryUploads = trimUploads(categoryUploads, limit, offset);
      categoryFormattedUploads[category.name] = categoryUploads;
    }

    return categoryFormattedUploads;
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

