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
  let metaThumbnail;

// if the upload server is a relative path prepend the protocol and host to make it an absolute url
  if(!validURL(uploadServer)){
    metaThumbnail = req.protocol + '://' + req.get('host') + uploadServer;
  } else {
    metaThumbnail = uploadServer;
  }

  /** SET META TAGS **/
  res.locals.meta.title = `${upload.title}`;

  res.locals.meta.description = upload.description || `Hosted on ${brandName}`;

  if(upload.fileType == 'video'){
    // set proper thumbnail url
    if(upload.thumbnail && upload.thumbnails.custom){
      res.locals.meta.image = `${metaThumbnail}/${upload.uploader.channelUrl}/${upload.thumbnails.custom}`;
    } else if(upload.thumbnails && upload.thumbnails.generated){
      res.locals.meta.image = `${metaThumbnail}/${upload.uploader.channelUrl}/${upload.thumbnails.generated}`;
    } else if(upload.thumbnails && upload.thumbnails.medium){
      res.locals.meta.image = `${metaThumbnail}/${upload.uploader.channelUrl}/${upload.thumbnails.medium}`;
    }

    res.locals.meta.video = `${metaThumbnail}/${upload.uploader.channelUrl}/${upload.uniqueTag}.mp4`;
  }

// TODO: fix this to use updated paths
  if(upload.fileType == 'audio'){
    res.locals.meta.image = upload.customThumbnailUrl || upload.thumbnailUrl;
  }

// TODO: implement this
// if(upload.fileType == 'image'){
//   res.locals.meta.image = upload.customThumbnailUrl || upload.thumbnailUrl;
// }

}

module.exports = saveMetaToResLocal;