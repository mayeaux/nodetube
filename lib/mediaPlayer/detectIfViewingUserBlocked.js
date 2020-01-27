const blockedUsers = upload.uploader.blockedUsers;

let viewingUserIsBlocked = false;
if(req.user){
  const viewingUserId = req.user._id;

  for(const blockedUser of blockedUsers){
    if(blockedUser.toString() == viewingUserId) viewingUserIsBlocked = true;
  }
}