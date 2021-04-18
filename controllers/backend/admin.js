const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const Comment = require('../../models/index').Comment;
const Notification = require('../../models/index').Notification;

// const adminActions  = ['userDeleted', 'userUndeleted', 'uploadDeleted', 'fullIpDeletion', 'banUser', 'unbanUser'];
const createAdminAction = require('../../lib/administration/createAdminAction');

const deleteUsers = require('../../lib/administration/deleteUsers');

exports.postUsers = async(req, res) => {

  const userId = req.body.user;

  const userChangeValue = req.body.userChangeValue;

  // kick out if not admin or moderator
  const adminOrModerator = req.user.id;

  // await createAdminAction(adminOrModerator, actionType, affectedUsers, affectedUploads, affectedSiteVisitors);

  let actionType;

  const user = await User.findOne({ _id: userId });

  if(userChangeValue == 'trustUser'){
    user.privs.autoVisibleUpload = true;
    await user.save();
  }

  if(userChangeValue == 'untrustUser'){
    user.privs.autoVisibleUpload = false;
    await user.save();
  }

  if(userChangeValue == 'banUser'){
    user.status = 'restricted';
    await user.save();
  }

  if(userChangeValue == 'unbanUser'){
    user.status = '';
    await user.save();
  }

  actionType = userChangeValue;

  await createAdminAction(adminOrModerator, actionType, user._id, [], []);

  req.flash('success', {msg: `User ${user.channelUrl} moderated, thank you.`});

  res.redirect('/admin/users');

};

exports.deleteAllUsersAndBlockIps = async(req, res) => {

  console.log(req.body);

  try {

    const response = await deleteUsers.deleteAllUsersAndBlockIps(req.body.channelUrl);

    res.send(response);

  } catch(err){
    res.status(500);
    res.send('fail');
  }

  // let unlistedUploads = await Upload.find({ visibility: 'unlisted' });

};

// TODO: add admin audit thing here
exports.changeRatings = async(req, res) => {

  try {

    let rating = req.body.rating;
    let uploads = req.body.uploads;

    let category = req.body.category;

    let visibility = req.body.visibility;

    console.log(rating);
    console.log(uploads);

    console.log(visibility);

    for(let upload of uploads){
      let foundUpload = await Upload.findOne({_id: upload});

      if(rating){

        const data = {
          originalRating: foundUpload.rating,
          updatedRating: req.body.rating
        };

        // save admin action for audit
        await createAdminAction(req.user, 'changeUploadRating', foundUpload.uploader._id, foundUpload, [], [], data);

        foundUpload.rating = rating;

        // mark it as moderated so user can't change it
        foundUpload.moderated = true;
      }

      if(category){
        foundUpload.category = category;
      }

      if(visibility){
        foundUpload.visibility = visibility;
      }

      await foundUpload.save();
    }

    res.send('success');

  } catch(err){
    console.log(err);
    res.status(500);
    res.send('fail');
  }

  // let unlistedUploads = await Upload.find({ visibility: 'unlisted' });

};

exports.deleteAccount = async(req, res) => {

  // fullUserDeletion

  let channelUrl = req.body.channelUrl;

  let user = await User.findOne({
    channelUrl
  });

  const uploads = await Upload.find({ uploader: user._id });

  const comments = await Comment.find({ commenter: user._id });

  // create admin action after all received
  await createAdminAction(req.user, 'fullUserDeletion', user._id, uploads, comments, []);

  const modDeletingAdmin = req.user.role == 'moderator' && user.role == 'admin';
  const modDeletingMod = req.user.role == 'moderator' && user.role == 'moderator';

  // dont let moderator delete admins
  if(modDeletingAdmin || modDeletingMod){
    return res.send('err');
  }

  // set user to restricted
  user.status = 'restricted';

  await user.save();

  // TODO: bug here, set all visibility as removed will have deleterious effects on private uploads, should use status instead
  // make all uploads visibility to removed
  for(let upload of uploads){
    upload.visibility = 'removed';
    await upload.save();
  }

  // make all comment visibility to removed
  for(let comment of comments){
    comment.visibility = 'removed';
    await comment.save();
  }

  res.send('success');

  // res.redirect(`/user/${channelUrl}`);
};

exports.undeleteAccount = async(req, res) => {

  // fullUserDeletion

  let channelUrl = req.body.channelUrl;

  let user = await User.findOne({
    channelUrl
  });

  user.status = '';

  await user.save();

  const uploads = await Upload.find({ uploader: user._id });

  const comments = await Comment.find({ commenter: user._id });

  // TODO: bug here, set all visibility as public will have deleterious effects on private uploads, should use status instead
  for(let upload of uploads){
    upload.visibility = 'public';
    await upload.save();
  }

  for(let comment of comments){
    comment.visibility = 'public';
    await comment.save();
  }

  await createAdminAction(req.user, 'fullUserUndeletion', user._id, uploads, comments, []);

  res.send('success');

  // res.redirect(`/user/${channelUrl}`);
};

exports.deleteUpload = async(req, res) => {

  const upload = await Upload.findOne({ uniqueTag: req.body.videoId }).populate('uploader');

  const userOwnsUploads = req.user._id.toString() == upload.uploader._id.toString();

  const userIsAdmin = req.user.role == 'admin';

  if(userOwnsUploads || userIsAdmin){
    upload.visibility = 'removed';
    await upload.save();

    // create admin action if deleting user is an admin
    if(userIsAdmin){
      await createAdminAction(req.user, 'uploadDeleted', upload.uploader, upload, []);
    }

    req.flash('success', {msg: 'Upload successfully deleted'});
    res.redirect(`/user/${upload.uploader.channelUrl}/`);
  } else {
    res.status(403);
    return res.render('error/500', {
      title: 'Server Error'
    });
  }
};

exports.postPending = async(req, res) => {

  // is it from the admin/uploads page? used in redirect
  const fromUploads = /uploads/.test(req.headers.referer);

  const fromMedia = req.body.fromMedia;

  const uniqueTag = req.body.uniqueTag;
  const moderationValue = req.body.moderationValue;

  console.log(uniqueTag, moderationValue);

  const upload = await Upload.findOne({ uniqueTag }).populate('uploader');
  const user = await User.findOne({ _id : upload.uploader });

  if(moderationValue == 'approve'){
    upload.visibility = 'public';
    await upload.save();
  }

  if(moderationValue == 'approveAndTrustUser'){
    upload.visibility = 'public';
    await upload.save();

    user.privs.autoVisibleUpload = true;
    await user.save();
  }

  if(moderationValue == 'banVideo'){
    upload.visibility = 'removed';
    await upload.save();
  }

  if(moderationValue== 'banVideoAndUser'){
    upload.visibility = 'removed';
    await upload.save();

    user.status = 'restricted';
    await user.save();
  }

  req.flash('success', {msg: `${upload.title} by ${user.channelUrl} moderated, thank you.`});

  if(fromMedia){
    res.redirect(req.headers.referer);
  } else if(fromUploads){
    res.redirect('/admin/uploads');
  } else {
    res.redirect('/pending');
  }

};

exports.postSiteVisitors = async(req, res) => {

  res.send('hello');

};

exports.postComments = async(req, res) => {

  const userId = req.body.user;
  const commentId = req.body.comment;
  const commentChangeValue = req.body.commentChangeValue;

  const user = await User.findOne({ _id: userId });
  const comment = await Comment.findOne({ _id: commentId });

  if(commentChangeValue == 'deleteComment'){
    comment.visibility = 'removed';
    await comment.save();
  }

  if(commentChangeValue == 'reinstateComment'){
    comment.visibility = 'public';
    await comment.save();
  }

  if(commentChangeValue == 'deleteCommentBanUser'){
    comment.visibility = 'removed';
    await comment.save();
    user.status = 'restricted';
    await user.save();
  }

  req.flash('success', {msg: `Comment by ${user.channelName} moderated, thank you.`});

  res.redirect('/admin/comments');
};

exports.sendNotification = async(req, res) => {

  let message = req.body.message;
  let channelUrl = req.body.channelUrl;

  const user = await User.findOne({
    channelUrl
  });

  let notification = new Notification({
    user,
    sender: req.user,
    action: 'message',
    text: message
  });

  await notification.save();

  res.redirect('/admin/notifications');
};

exports.getUserAccounts = async(req, res) => {

  try {

    const response = await deleteUsers.getUsersAndSiteVisitAmount(req.body.channelUrl);

    res.send(response);

  } catch(err){
    res.status(500);
    res.send('fail');
  }

  // let unlistedUploads = await Upload.find({ visibility: 'unlisted' });

};
