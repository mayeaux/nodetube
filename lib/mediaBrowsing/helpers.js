const _ = require('lodash');

function getSensitivityFilter(user, siteVisitor){
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

module.exports = {
  getSensitivityFilter,
  filterUploadsBySensitivity,
  filterUploadsByCategory,
  filterUploadsBySubcategory,
  filterUploadsByMediaType,
  trimUploads
};