function getFilter(user, siteVisitor){
  if(user){
    filter = user.filter
  } else {
    filter = siteVisitor.filter
  }
}

function filterUploads(uploads, filter){
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

module.exports = {
  getFilter,
  filterUploads
};