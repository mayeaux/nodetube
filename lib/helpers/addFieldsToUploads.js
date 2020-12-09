function attachDataToUploadsAsUploads(uploads , channelHasPlus, channelUrl){
  const uploaderHasPlus = upload.uploader.plan === 'plus';

  channelUrl = channelUrl || upload && upload.uploader && upload.uploader.channelUrl;

  const userHasPlus = channelHasPlus || uploaderHasPlus;

  uploads = uploads.map(function(upload){

    if(!userHasPlus){
      upload.pathToUploader = `/user/${channelUrl}`
    } else {
      upload.pathToUploader = `/${channelUrl}`
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
