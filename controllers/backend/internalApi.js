/** UNFINISHED **/
/* eslint-disable no-unused-vars */

const bluebird = require('bluebird');
const Promise = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const graph = require('fbgraph');
const Twit = require('twit');
const formidable = require('formidable');
const path = require('path');
const multer = require('multer');
const fs = require('fs-extra');
const multiparty = require('multiparty');
var B2 = require('easy-backblaze');
const _ = require('lodash');
var randomstring = require('randomstring');
var ffmpeg = require('fluent-ffmpeg');
var mongoose = require('mongoose');
var concat = require('concat-files');
var Busboy = require('busboy');
const mkdirp = Promise.promisifyAll(require('mkdirp'));
const mv = require('mv');

const backblaze = require('../../lib/uploading/backblaze');

const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;

const createAdminAction = require('../../lib/administration/createAdminAction');
const { saveAndServeFilesDirectory } = require('../../lib/helpers/settings');

// const stripe = require('stripe')(process.env.STRIPE_SKEY);
// const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
// const paypal = require('paypal-rest-sdk');
// const lob = require('lob')(process.env.LOB_KEY);

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

if(process.env.THUMBNAIL_SERVER){
  console.log(`THUMBNAIL SERVER: ${process.env.THUMBNAIL_SERVER}`);
}

const frontendServer = process.env.FRONTEND_SERVER || '';

const createNotification = require('../../lib/helpers/notifications');

// models
const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;
const Comment = require('../../models/index').Comment;
const React = require('../../models/index').React;
const Subscription = require('../../models/index').Subscription;
const Notification = require('../../models/index').Notification;
const CreditAction = require('../../models/index').CreditAction;
const Report = require('../../models/index').Report;

const getMediaType = require('../../lib/uploading/media');

const ffmpegHelper = require('../../lib/uploading/ffmpeg');
var resumable = require('../../lib/uploading/resumable.js')(__dirname +  '/upload');

const accountId = process.env.backBlazeId;
const applicationKey = process.env.backBlazeAppKey;
const bucket = process.env.BACKBLAZE_BUCKET;
var b2 = Promise.promisifyAll(new B2(accountId, applicationKey));

let hostPrepend = '';
if(process.env.NODE_ENV == 'production') hostPrepend = `https://${domainNameAndTLD}`;

var appDir = path.dirname(require.main.filename);

let uploadServer;
// development with no upload server
if(process.env.NODE_ENV !== 'production' && !process.env.UPLOAD_SERVER){
  uploadServer = '/uploads';
// development with an upload server
} else if(process.env.NODE_ENV !== 'production' && process.env.UPLOAD_SERVER){
  // otherwise load the upload's uploadServer
  uploadServer = `https://${process.env.UPLOAD_SERVER}.${domainNameAndTLD}/uploads`;
} else {
  uploadServer = `https://${process.env.UPLOAD_SERVER}.${domainNameAndTLD}/uploads`;
}

async function updateUsersUnreadSubscriptions(user){
  const subscriptions = await Subscription.find({ subscribedToUser: user._id, active: true });

  for(const subscription of subscriptions){
    let subscribingUser = await User.findOne({ _id: subscription.subscribingUser });

    subscribingUser.unseenSubscriptionUploads = subscribingUser.unseenSubscriptionUploads + 1;
    await subscribingUser.save();
  }

}

/**
 * POST /api/changeDefaultUserQuality
 * Change user's default quality option
 */
exports.changeDefaultUserQuality = async(req, res) => {
  const quality = req.params.quality;

  let siteVisitor = req.siteVisitor;
  let user = req.user;

  // save siteVisitor quality
  siteVisitor.defaultQuality = quality;
  await siteVisitor.save();

  // save user default quality
  if(user){
    user.defaultQuality = quality;
    await user.save();
  }

  res.send('success');
};

exports.blockUser = async(req, res) => {

  try {

    const blockedUsername = req.body.blockedUsername;

    console.log(`blocking ${blockedUsername} for ${req.user.channelUrl}`);

    const blockedUser = await User.findOne({channelUrl: blockedUsername}).select('id _id');

    let userAlreadyBlocked;
    for(let[index, alreadyBlockedUser]of req.user.blockedUsers.entries()){

      if(alreadyBlockedUser == blockedUser._id.toString()){
        userAlreadyBlocked = true;
      }
    }

    if(userAlreadyBlocked){
      console.log('user already blocked');
      return res.send('success');
    }

    req.user.blockedUsers.push(blockedUser._id);

    await req.user.save();

    res.send('success');

  } catch(err){
    console.log(err);
    res.status(500);
    res.send('error');
  }

};

exports.unblockUser = async(req, res) => {

  try {

    const blockedUsername = req.body.blockedUsername;

    const blockedUser = await User.findOne({channelUrl: blockedUsername}).select('id _id');

    let blockedUserIndex;
    for(let[index, alreadyBlockedUser]of req.user.blockedUsers.entries()){

      if(alreadyBlockedUser == blockedUser._id.toString()){
        blockedUserIndex = index;
      }
    }

    req.user.blockedUsers.splice(blockedUserIndex, 1);

    await req.user.save();

    res.send('success');

  } catch(err){
    console.log(err);
    res.status(500);
    res.send('error');
  }

};

/**
 * POST /api/report
 * Report an upload
 */
exports.reportUpload = async(req, res) => {
  let siteVisitor = req.siteVisitor;
  let user = req.user;
  const uploadId = req.body.uploadId;
  const reason = req.body.reason;

  const upload = await Upload.findOne({ _id: uploadId });

  let report = new Report({
    upload,
    reason,
    reportingingSiteVisitor : siteVisitor,
    uploadingUser: upload.uploader
  });

  if(user){
    report.reportingUser = user;
  }

  await report.save();

  console.log('report created');

  return res.send('success');

};

/**
 * POST /
 *
 */
exports.changeUserFilter = async(req, res) => {
  let siteVisitor = req.siteVisitor;
  let user = req.user;

  siteVisitor.filter = req.body.filter;
  await siteVisitor.save();

  if(user){
    user.filter = req.body.filter;
    await user.save();
  }

  console.log('changing sensitivity');

  // console.log(siteVisitor, user);
  //
  // console.log(req.body);

  return res.send('success');

};

async function markUploadAsComplete(uniqueTag, channelUrl, user, res){
  upload = await Upload.findOne({ uniqueTag });
  upload.status = 'completed';
  await upload.save();

  user.uploads.push(upload._id);
  await user.save();

  return'success';
}

async function uploadToB2(upload, uploadPath, hostFilePath){

  console.log('upload to b2');

  if(upload.fileType == 'video'){
    upload.fileExtension = '.mp4';
  }

  const response = await b2.uploadFileAsync(uploadPath, {
    name: hostFilePath + upload.fileExtension,
    bucket // Optional, defaults to first bucket
  });

  upload.uploadUrl = response;

  await upload.save();

  console.log(response);
}

/** delete user/channel upload **/
exports.deleteChannelThumbnail = async(req, res, next) => {

  console.log(req.body.uploadToken);

  if(!req.user && req.body.uploadToken){
    req.user = await User.findOne({ uploadToken : req.body.uploadToken });
  }

  req.user.thumbnailUrl = undefined;
  req.user.customThumbnail = undefined;
  await req.user.save();

  return res.send('success');
};

/** delete upload thumbnail **/
exports.deleteUploadThumbnail = async(req, res, next) => {

  try {
    console.log(req.body.uploadToken);

    if(!req.user && req.body.uploadToken){
      req.user = await User.findOne({ uploadToken : req.body.uploadToken });
    }

    const upload = await Upload.findOne({ uniqueTag: req.params.uniqueTag }).populate('uploader');

    if(!upload){
      res.send('no upload');
    }

    if(upload.uploader.id.toString() !== req.user.id.toString()){
      res.send('not authenticated');
    }

    upload.customThumbnailUrl = undefined;
    upload.thumbnails.custom = undefined;
    await upload.save();

    res.send('success');

    console.log(req.body);
  } catch(err){
    console.log(err);
  }

};

exports.subscribeEndpoint = async function(req, res, next){

  // get receiving user
  let receivingUser = req.body.channelUrl;
  const subscribingUser = req.user;
  const uniqueTag = req.body.uniqueTag;

  let uploadId, upload;
  if(uniqueTag){
    upload = await Upload.findOne({ uniqueTag });
    uploadId = upload._id;
  }

  // TODO: Add upload and saving as drivingUpload

  // user getting new subscription (fallback to _id if channelUrl misses)
  receivingUser = await User.findOne({ channelUrl: receivingUser }).populate('receivedSubscriptions');
  if(receivingUser == null){
    receivingUser = await User.findOne({ _id: receivingUser }).populate('receivedSubscriptions');
  }

  if(!receivingUser){
    return res.send('Couldnt find user');
  }

  let alreadySubbed = false;
  let existingSubscription;

  // console.log(receivingUser);

  // determine if user is already subscribed and if so load that subscription
  for(let subscription of receivingUser.receivedSubscriptions){

    // console.log(subscription)

    if(subscription.subscribingUser.toString() == req.user._id.toString()){
      alreadySubbed = true;
      existingSubscription = subscription;
    }
  }

  // create a notification
  if(!alreadySubbed){

    console.log('not already subbed');

    let subscription = new Subscription({
      subscribingUser: subscribingUser._id,
      subscribedToUser: receivingUser._id,
      active: true,
      drivingUpload: uploadId
    });

    await subscription.save();

    // TODO: THIS ISNT WORKING
    receivingUser.receivedSubscriptions.push(subscription._id);
    await receivingUser.save();

    subscribingUser.subscriptions.push(subscription._id);
    await subscribingUser.save();

    // send notification if youre not subscribing to your own channel

    console.log(receivingUser._id, req.user._id);

    if(receivingUser._id.toString() !== subscribingUser._id.toString()){

      console.log('creating sub notification');

      const notification = new Notification({
        user : receivingUser._id,
        sender : subscribingUser._id,
        action : 'subscription',
        upload: uploadId,
        subscription: subscription._id
      });

      await notification.save();

      console.log(notification);

      console.log('here');

    }

    res.send('subscribed');

  } else if(existingSubscription.active == true){
    existingSubscription.active = false;
    await existingSubscription.save();

    res.send('unsubscribed');
  } else if(existingSubscription.active == false){
    existingSubscription.active = true;

    await existingSubscription.save();

    res.send('resubscribed');
  }

};

/** handle react creation/updating **/
exports.react = async(req, res, next)  => {
  // console.log(`${req.user._id}` , req.params.user);

  if(`${req.user._id}` !== req.params.user){
    return res.send('Not authorized');
  }

  const existingReact = await React.findOne({
    upload: req.params.upload,
    user: req.params.user
  }).populate('upload user');

  const upload = await Upload.findOne({
    _id : req.params.upload
  }).populate('uploader');

  if(!upload){
    return res.send('Thing');
  }

  // if existing react, update or not
  if(existingReact){
    if(existingReact == req.body.emoji){
      return res.end('no change');
    } else {
      existingReact.react = req.body.emoji;
      await existingReact.save();
      return res.send('changed');
    }

  // otherwise create a new react
  } else {

    const newReact = new React({
      upload: req.params.upload,
      user: req.params.user,
      react: req.body.emoji
    });

    await newReact.save();

    upload.reacts.push(newReact._id);
    await upload.save();

    // add a notification

    // create notif for comment on your upload if its not your own thing
    if(upload.uploader._id.toString() !== req.user._id.toString()){
      await createNotification(upload.uploader._id, req.user._id, 'react', upload, newReact);
    }

    res.send('new react created');
  }
};

/** POST EDIT UPLOAD **/
exports.editUpload = async(req, res, next) => {

  console.log(req.body);

  try {

    if(!req.user && req.body.uploadToken){
      req.user = await User.findOne({uploadToken: req.body.uploadToken});
    }

    // TODO: Add error handling

    const uniqueTag = req.params.uniqueTag;

    let upload = await Upload.findOne({
      uniqueTag
    }).populate({path: 'uploader comments checkedViews', populate: {path: 'commenter'}}).exec();

    // determine if its the user of the channel
    const isAdmin = req.user && req.user.role == 'admin';
    const isModerator = req.user && req.user.role == 'moderator';
    const isAdminOrModerator = isAdmin || isModerator;
    const isUser = req.user && ( req.user._id.toString() == upload.uploader._id.toString() );

    /** If it is an admin or moderator changing the rating, save as adminAction and only change rating, mark as moderated  **/
    // TODO: pull this logic out of controller
    if(!isUser && !isAdmin && !isAdminOrModerator){
      return res.render('error/403');
    }

    const uploadRatingIsChanging = upload.rating !== req.body.rating;
    const isModeratorOrAdmin = isModerator || isAdmin;

    // if moderator or admin is updating rating
    if(isModeratorOrAdmin && uploadRatingIsChanging){
      upload.moderated = true;

      const data = {
        originalRating: upload.rating,
        updatedRating: req.body.rating
      };

      // save admin action for audit
      await createAdminAction(req.user, 'changeUploadRating', upload.uploader._id, upload, [], [], data);
    }

    // load upload changes
    upload.title = req.body.title;
    upload.description = req.body.description;
    upload.rating = req.body.rating;
    upload.category = req.body.category;
    upload.subcategory = req.body.subcategory;

    // check if there's a thumbnail
    let filename, fileType, fileExtension;
    if(req.files && req.files.filetoupload){
      filename = req.files.filetoupload.originalFilename;
      fileType = getMediaType(filename);
      fileExtension = path.extname(filename);
    }

    const fileIsNotImage = req.files && req.files.filetoupload && req.files.filetoupload.size > 0 && fileType && fileType !== 'image';

    console.log(req.files);

    const fileIsImage = req.files && req.files.filetoupload && req.files.filetoupload.size > 0 && fileType == 'image';

    // console.log(req.files);

    // TODO: would be great if this was its own endpoint

    // reject the file
    if(fileIsNotImage){
      return res.send('We cant accept this file');
      // gotta save and upload image
    } else if(fileIsImage){

      await fs.move(req.files.filetoupload.path, `${saveAndServeFilesDirectory}/${req.user.channelUrl}/${upload.uniqueTag}-custom${fileExtension}`, {overwrite: true});

      upload.thumbnails.custom = `${upload.uniqueTag}-custom${fileExtension}`;

      if(process.env.UPLOAD_TO_B2 == 'true'){

        await backblaze.editploadThumbnailToB2(req.user.channelUrl, upload.uniqueTag, fileExtension, upload);
      }

      // sendUploadThumbnailToB2(args)

      await upload.save();

      return res.send('success');

    } else {

      console.log('no thumbnail being saved');

      await upload.save();

      return res.send('success');

    }
  } catch(err){
    console.log(err);
    res.status(500);
    res.send('failure');
  }
};

/**
 * POST /api/comment
 * List of API examples.
 */
exports.deleteComment = async(req, res) => {

  try {
    // double check this comment doesn't already exist
    let existingComment = await Comment.findOne({ _id: req.body.commentId }).populate('commenter');

    // console.log(existingComment)

    // console.log(req.body.upload);

    // console.log(req.user._id);

    let upload = await Upload.findOne({ _id: req.body.upload }).populate('uploader');

    const userIsUploader = upload.uploader._id.toString() == req.user._id.toString();

    const userIsCommenter = existingComment.commenter._id.toString() == req.user._id.toString();

    console.log(userIsCommenter);

    // make sure the user has right to delete that comment
    if(!userIsUploader && !userIsCommenter){
      throw new Error('not the proper user');
    }

    existingComment.visibility = 'removed';

    await existingComment.save();

    res.send('success');
  }
  catch(err){

    console.log(err);

    res.status(500);
    res.send('failed to post comment');

  }

};

/**
 * POST /api/comment
 * List of API examples.
 */
exports.postComment = async(req, res) => {

  if(req.user.status == 'restricted'){
    return res.send('Comment failed, please try again.');
  }

  if(!req.body.comment){
    res.status(500);
    return res.send('failed to post comment');
  }

  try {

    // note: this functionality is kind of crappy so turning it off
    // it was to prevent double posting but if that does come up again make a nicer implementation
    // double check this comment doesn't already exist
    // const oldComment = await Comment.findOne({
    //   text: req.body.comment,
    //   upload: req.body.upload
    // });
    //
    // if(oldComment){
    //   return res.send('Comment already exists');
    // }

    let upload = await Upload.findOne({_id: req.body.upload}).populate('uploader');

    const blockedUsers = upload.uploader.blockedUsers;

    let viewingUserIsBlocked = false;
    if(req.user){
      const viewingUserId = req.user._id;

      for(const blockedUser of blockedUsers){
        if(blockedUser.toString() == viewingUserId) viewingUserIsBlocked = true;
      }
    }

    if(viewingUserIsBlocked){
      res.status(500);
      return res.send('user is blocked from sending comment');
    }

    // create and save comment
    let comment = new Comment({
      text: req.body.comment,
      upload: req.body.upload,
      commenter: req.user._id,
      inResponseTo: req.body.commentId
    });

    await comment.save();

    if(req.body.commentId){
      let respondedToComment = await Comment.findOne({ _id : req.body.commentId });

      respondedToComment.responses.push(comment._id);

      await respondedToComment.save();

      console.log(respondedToComment);
    }

    comment = await comment.save();

    // CREATE NOTIFICATION

    let user = req.user;

    user.comments.push(comment._id);

    user = await user.save();

    upload.comments.push(comment._id);

    upload = await upload.save();

    // send notification if youre not reacting to your own material

    // create notif for comment on your upload if its not your own thing
    if(upload.uploader._id.toString() !== req.user._id.toString()){
      await createNotification(upload.uploader._id, req.user._id, 'comment', upload, undefined, comment);
    }

    // if its a reply comment send a notification to the original commenter
    if(req.body.commentId){
      // find replied to comment and get commenter
      const repliedToComment = await Comment.findOne({
        _id : req.body.commentId
      }).populate('commenter');

      const user = repliedToComment.commenter;

      if(user._id.toString() !== req.user._id.toString()){
        await createNotification(user._id, req.user._id, 'comment', upload, undefined, comment);
      }
    }

    const timeAgo = timeAgoEnglish.format( new Date(comment.createdAt)  );

    let responseObject = {
      text: comment.text,
      user: req.user.channelName || req.user.channelUrl,
      timeAgo
    };

    res.json(responseObject);

    // res.send('success')
  }
  catch(err){

    console.log(err);

    res.status(500);
    res.send('failed to post comment');

  }

};

/**
 * POST /api/credit
 * Send credit to another user
 */
exports.sendUserCredit = async(req, res) => {

  let sendingUser = req.user;

  let amount = req.body.amount;

  amount = Math.round(amount);

  amount = Math.abs(amount);

  const upload = req.body.upload;

  const notANumber = isNaN(amount);

  if(notANumber){
    res.status(400);
    return res.send('failure');
  }

  if(amount > req.user.credit){
    res.status(400);
    return res.send('failure');
  }

  console.log('amount ' + amount);

  let channelUrl = req.body.channelUrl;

  console.log(channelUrl);

  let receivingUser = await User.findOne({ channelUrl });

  console.log(receivingUser.channelUrl);

  console.log(req.body.channelUrl);

  if(receivingUser.plan !== 'plus'){
    console.log('not plus');
    res.status(500);
    return res.send('failure');
  }

  if(receivingUser.channelUrl == sendingUser.channelUrl){
    console.log('same user');
    res.status(500);
    return res.send('failure');
  }

  console.log(amount);
  console.log(typeof amount);

  console.log(sendingUser.credit);

  const receivingUserInitialCredit = receivingUser.receivedCredit;
  const sendingUserInitialCredit = sendingUser.credit;

  sendingUser.credit = sendingUser.credit - amount;
  console.log(sendingUser.credit);

  await sendingUser.save();

  console.log(receivingUser.credit);

  receivingUser.receivedCredit = receivingUser.receivedCredit + amount;

  console.log(receivingUser.credit);

  await receivingUser.save();

  let creditAction = new CreditAction({
    sendingUser,
    receivingUser,
    amount,
    receivingUserInitialCredit,
    receivingUserFinalCredit : receivingUser.receivedCredit,
    sendingUserInitialCredit,
    sendingUserFinalCredit: sendingUser.credit,
    upload
  });

  console.log('credit action');

  await creditAction.save();

  return res.send('success');

};
