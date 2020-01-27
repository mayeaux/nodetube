const userIsAdmin = req.user && req.user.role == 'admin';

// if there is no upload, or upload is deleted and user is not admin
if(!upload || ( upload.visibility == 'removed' && !userIsAdmin)){
  console.log('Visible upload not found');
  res.status(404);
  return res.render('error/404');
}




// determine if its the user of the channel
let isAdmin = false;
let isUser = false;
if(req.user){
  // its the same user
  isUser =  ( req.user._id.toString() == upload.uploader._id.toString()  );

  // the requesting user is an adming
  isAdmin = req.user.role == 'admin';
}

const isUploader =  req.user && req.user._id.toString() == upload.uploader._id.toString();

const isUserOrAdmin = isAdmin || isUser;
const isUploaderOrAdmin = isUploader || isAdmin;



// if upload should only be visible to logged in user
if(upload.visibility == 'pending' || upload.visibility == 'private'){

  // if no user automatically don't show
  if(!req.user){
    res.status(404);
    return res.render('error/404');
  }

  // if the requesting user id matches upload's uploader id
  const isUsersDocument = req.user._id.toString() == upload.uploader._id.toString();

  // if its not the user's document and the user is not admin
  if(!isUsersDocument && ( req.user.role !== 'admin' && req.user.role !== 'moderator' )){
    res.status(404);
    return res.render('error/404');
  }

  // if is user's document or requesting user is admin
  if(isUsersDocument || req.user.role == 'admin'){
    res.render('media', {
      title: upload.title,
      comments,
      upload,
      channel,
      media,
      commentCount,
      categories,
      emojis,
      uploadServer
    });
  }

}