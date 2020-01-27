// viewer is req.user
function hideUpload(upload, viewer) {
  let viewerIsMod = Boolean(viewer && (viewer.role == 'admin' || viewer.role == 'moderator'));

  let viewerIsOwner = (viewer && viewer.channelUrl) == upload.uploader.channelUrl;

  let viewerIsAdminOrMod = false;
  if (viewer && (viewer.role == 'admin' || viewer.role == 'moderator')) {
    viewerIsAdminOrMod = true;
  }

  let visibility = upload.visibility;

  // ['public', 'unlisted', 'private', 'removed', 'pending']
  /** only ones not listed are public and unlisted which are visible in every case **/


  // viewer is not admin or owner and visibility not public or unlisted, 404
  if (visibility == 'removed' && !viewerIsAdminOrMod) {
    console.log('removed upload, hide')
    return true
  }

  // viewer is not admin or owner and visibility not public, 404
  else if (( visibility == 'private' || visibility == 'pending' ) && !viewerIsOwner && !viewerIsAdminOrMod) {
    console.log('private or pending, hide')
    return true
  } else {
    console.log('no need to hide')
    return false
  }

}

module.exports = hideUpload;