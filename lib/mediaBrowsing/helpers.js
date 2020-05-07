const _ = require('lodash');
const { secondsToFormattedTime } = require('../../lib/helpers/time');
const { getVideoDurationInSeconds } = require('get-video-duration');
const { getAudioDurationInSeconds  } = require('get-audio-duration');

function getSensitivityFilter(user, siteVisitor){
  // TODO: make this smarter to account for MAX_RATING_ALLOWED settings
  let filter;

  if(user){
    filter = user.filter
  } else {
    filter = siteVisitor.filter
  }

  return filter
}

function filterUploadsByMediaType(uploads, mediaType){

  if(!mediaType) return uploads

  if(mediaType == 'all') return uploads

  if(mediaType == 'image'){
    // nothing to do

    return _.filter(uploads, function(upload){
      return upload.fileType == mediaType
    });

  } else if (mediaType == 'video'){

    // return ones not marked as sensitive
    return _.filter(uploads, function(upload){
      return upload.fileType == mediaType
    });

  } else if (mediaType == 'audio'){

    // return ones not marked as sensitive
    return _.filter(uploads, function(upload){
      return upload.fileType == mediaType
    });

  }
}

function filterUploadsBySensitivity(uploads, filter){
  if(filter == 'sensitive'){
    // nothing to do
  } else if (filter == 'mature'){

    // return ones not marked as sensitive
    uploads = _.filter(uploads, function(upload){
      return upload.rating !== 'sensitive'
    });

  } else if (filter == 'allAges'){

    // return ones not marked as sensitive or mature
    uploads = _.filter(uploads, function(upload){
      return upload.rating !== 'sensitive' && upload.rating !== 'mature'
    });
  }

  return uploads
}

function filterUploadsByCategory(uploads, category){

  if(category){
    return _.filter(uploads, function(upload){
      return upload.category == category
    });
  } else {
    return uploads
  }
}

function filterUploadsBySubcategory(uploads, subcategory){

  return _.filter(uploads, function(upload){
    return upload.subcategory == subcategory
  });
}

function trimUploads(uploads, amountToOutput, skipAmount){

  // Only get needed amount of uploads
  // cut offset off from front of array
  let trimmedUploads = uploads.slice(skipAmount);

  // reduce the length of array to the limit amount
  if(trimmedUploads.length > amountToOutput){
    trimmedUploads.length = amountToOutput;
  }

  return trimmedUploads
}

async function getUploadDuration(url, fileType) {
  // console.log(url);

  let duration;
  if(fileType == "video"){
    // console.log('video');
    duration = await getVideoDurationInSeconds(url);
  }
  else if(fileType == "audio"){
    // console.log('audio');
    duration = await getAudioDurationInSeconds(url);
  } else {
    duration = 0;
  }

  // console.log(duration);

  return {seconds: duration, formattedTime: secondsToFormattedTime(duration)}
}

module.exports = {
  getSensitivityFilter,
  filterUploadsBySensitivity,
  filterUploadsByCategory,
  filterUploadsBySubcategory,
  filterUploadsByMediaType,
  trimUploads,
  getUploadDuration
};