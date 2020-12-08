function attachDataToUploadsAsUploads(uploads){
  uploads = uploads.map(function(upload){
    const uploaderPlan = upload.uploader.plan;

    const uploaderHasPlus = uploaderPlan === 'plus';

    if(!uploaderHasPlus){
      upload.pathToUploader = `/user/${upload.uploader.channelUrl}`
    } else {
      upload.pathToUploader = `/${upload.uploader.channelUrl}`
    }

    console.log(upload.pathToUploader)

    return upload
  })

  return uploads
}


/** this is for category section **/
// going to loop through all the uploads, check if the uploader has plus, and if so, will build a path without 'user' prepend
function attachDataToUploadsAsCategories(uploads){
  let newUploads = {};

  for(let category in uploads){

    const categoryName = category;

    category = uploads[category]
    category = category.map(function(upload){
      const uploaderPlan = upload.uploader.plan;

      const uploaderHasPlus = uploaderPlan === 'plus';

      if(uploaderHasPlus){
        upload.pathToUploader = `/${upload.uploader.channelUrl}`
      } else {
        upload.pathToUploader = `/user/${upload.uploader.channelUrl}`
      }

      console.log('path to uploader')
      console.log(upload.pathToUploader)

      return upload
    })

    // console.log(category);

    newUploads[categoryName] = category
  }

  return newUploads
}
module.exports = {
  attachDataToUploadsAsUploads,
  attachDataToUploadsAsCategories
};
