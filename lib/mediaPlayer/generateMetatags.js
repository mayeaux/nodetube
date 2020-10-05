const brandName = process.env.INSTANCE_BRAND_NAME;

// TODO: put this in the config file for determining uploadUrl
function validURL(str){
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return!!pattern.test(str);
}

function saveMetaToResLocal(upload, uploadServer, req, res){
  let formattedUploadServer;

  // if the upload server is a relative path prepend the protocol and host to make it an absolute url
  // if it is in fact a url, you can just let the uploadServer run
  // this is because a relative path will brick the scrapers
  if(!validURL(uploadServer)){
    formattedUploadServer = req.protocol + '://' + req.get('host') + uploadServer;
  } else {
    formattedUploadServer = uploadServer;
  }

  const baseUrl = req.protocol + '://' + req.get('host');

  /** SET META TAGS **/
  res.locals.meta.title = `${upload.title}`;

  res.locals.meta.description = upload.description || `Hosted on ${brandName}`;

  if(upload.fileType == 'video'){
    // set proper thumbnail url
    if(upload.thumbnail && upload.thumbnails.custom){
      res.locals.meta.image = `${formattedUploadServer}/${upload.uploader.channelUrl}/${upload.thumbnails.custom}`;
    } else if(upload.thumbnails && upload.thumbnails.generated){
      res.locals.meta.image = `${formattedUploadServer}/${upload.uploader.channelUrl}/${upload.thumbnails.generated}`;
    } else if(upload.thumbnails && upload.thumbnails.medium){
      res.locals.meta.image = `${formattedUploadServer}/${upload.uploader.channelUrl}/${upload.thumbnails.medium}`;
    }

    res.locals.meta.video = `${formattedUploadServer}/${upload.uploader.channelUrl}/${upload.uniqueTag}.mp4`;
  }

  if(upload.fileType == 'audio'){
    res.locals.meta.image = `${baseUrl}/images/audio.png`;
  }

  if(upload.fileType == 'image'){
    res.locals.meta.image = `${formattedUploadServer}/${upload.uploader.channelUrl}/${upload.uniqueTag}${upload.fileExtension}`;
  }

}



function saveMetaToResLocalForChannelPage(user, uploadServer, req, res){

  let formattedUploadServer;

  // if the upload server is a relative path prepend the protocol and host to make it an absolute url
  // if it is in fact a url, you can just let the uploadServer run
  // this is because a relative path will brick the scrapers
  if(!validURL(uploadServer)){
    formattedUploadServer = req.protocol + '://' + req.get('host') + uploadServer;
  } else {
    formattedUploadServer = uploadServer;
  }

  const baseUrl = req.protocol + '://' + req.get('host');

  // set it as custom thumbnail if it exists
  if(user.customThumbnail){

    res.locals.meta.image = `${formattedUploadServer}/${user.channelUrl}/${user.customThumbnail}`;

  }

  // functionality to use the thumbnail of the user's first url, too annoying so I'm commenting it out for the time being
  // else if (user.uploads && user.uploads[0]){
  //
  //   if(user.uploads[0].thumbnails && user.uploads[0].thumbnails.generated){
  //     res.locals.meta.image = user.uploads[0].customThumbnailUrl
  //
  //   } else {
  //     res.locals.meta.image = `${formattedUploadServer}/${user.channelUrl}/${user.uploads[0].thumbnails.generated}`;
  //   }
  //
  //
  //
  //
  //   res.locals.meta.image = `${formattedUploadServer}/${upload.uploader.channelUrl}/${upload.uniqueTag}${upload.fileExtension}`;
  //
  // }

  else {
    res.locals.meta.image = `${baseUrl}/images/default-user-icon2.jpg`;

  }


}

module.exports = {
  saveMetaToResLocal,
  saveMetaToResLocalForChannelPage
};