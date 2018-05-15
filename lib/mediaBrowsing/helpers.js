const _ = require('lodash');

function getSensitivityFilter(user, siteVisitor){
  if(user){
    filter = user.filter
  } else {
    filter = siteVisitor.filter
  }

  console.log(filter + 'hello1')

  return filter
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

module.exports = {
  getSensitivityFilter,
  filterUploadsBySensitivity,
  filterUploadsByCategory,
  filterUploadsBySubcategory
};