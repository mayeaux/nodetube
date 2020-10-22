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
const FileType = require('file-type');

const srt2vtt = Promise.promisifyAll(require('srt2vtt'));

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
const LastWatchedTime = require('../../models/index').LastWatchedTime;
const PushEndpoint = require('../../models/index').PushEndpoint;
const PushSubscription = require('../../models/index').PushSubscription;
const EmailSubscription = require('../../models/index').EmailSubscription;

const getMediaType = require('../../lib/uploading/media');
const pushNotificationLibrary = require('../../lib/mediaPlayer/pushNotification');

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

function convertPromise(inputPath, outputPath){

  var srtData = fs.readFileSync(inputPath);

  // 1 - Create a new Promise
  return new Promise(function(resolve, reject){

    srt2vtt(srtData, function(err, vttData){

      if(err){
        reject(err);
      } else {

        fs.writeFileSync(outputPath, vttData);
        resolve(vttData);
      }

    });

  });
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

  // console.log(req.body);

  // console.log(`${req.user._id}` , req.params.user);

  // if the user is not authenticated to act on behalf of that user
  if(`${req.user._id}` !== req.params.user){
    return res.send('Not authorized');
  }

  // find an existing react per that user and upload
  const existingReact = await React.findOne({
    upload: req.params.upload,
    user: req.params.user
  }).populate('upload user');

  // find the upload for that react
  const upload = await Upload.findOne({
    _id : req.params.upload
  }).populate('uploader');

  if(!upload){
    return res.send('Thing');
  }

  let newReact;

  if(!existingReact){
    newReact = new React({
      upload: req.params.upload,
      user: req.params.user,
      react: req.body.emoji,
      active: true
    });

    await newReact.save();

    upload.reacts.push(newReact._id);
    await upload.save();

  // if existing react, update or not
  } else if(existingReact && existingReact.active){

    // user selected the react that was already active (wants to remove)
    if(existingReact.react == req.body.emoji){
      existingReact.active = false;
      await existingReact.save();
      return res.send('removed');
    } else {

      // user changed the react
      existingReact.react = req.body.emoji;
      await existingReact.save();
      return res.send('changed');
    }

  // otherwise create a new react
  } else if(existingReact && !existingReact.active){
    // there is a react, but it is inactive
    existingReact.active = true;
    existingReact.react = req.body.emoji;
    await existingReact.save();
  } else {
    console.log('THIS SHOULDN\'T BE TRIGGERED, THE LOGIC IS OFF');
  }

  // add a notification

  // create notif for comment on your upload if its not your own upload
  if(upload.uploader._id.toString() !== req.user._id.toString()){
    await createNotification(upload.uploader._id, req.user._id, 'react', upload, newReact);
  }

  res.send('new react created');
};

/** POST EDIT UPLOAD **/
exports.editUpload = async(req, res, next) => {

  // console.log(req.body);
  //
  // return res.send('hello');

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
    if(upload.uploader.plan == 'plus')
      upload.visibility = req.body.visibility;
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

    // console.log(req.files);
    // console.log(req.files.length);

    //
    const fileIsNotImage = req.files && req.files.filetoupload && req.files.filetoupload.size > 0 && fileType && fileType !== 'image';

    console.log('req files');
    console.log(req.files);

    // TODO: you have to make this smarter by checking the FileType

    const fileIsImage = req.files && req.files.filetoupload && req.files.filetoupload.size > 0 && fileType == 'image';

    const imagePath = req.files && req.files.filetoupload && req.files.filetoupload.path;

    // not doing anything just logging it atm
    let fileTypeData;
    if(imagePath){
      const fileTypeData = await FileType.fromFile(imagePath);
      console.log(fileTypeData);

    }

    const webVttPath = req.files && req.files.webvtt && req.files.webvtt.path;

    const originalName = req.files && req.files.webvtt && req.files.webvtt.originalFilename;

    const webVttFile = req.files && req.files.webvtt;

    // if there is a path, and it's not a falsy value, because these empty strings are being regarded as values
    if(webVttPath && originalName){
      const originalName = webVttFile.originalFilename;

      const subtitlefileExtension = path.extname(originalName);

      console.log('subtitle');
      console.log(subtitlefileExtension);

      if(subtitlefileExtension == '.srt'){
        // do the convert here
        if(subtitlefileExtension == '.srt'){
          console.log('SRT FILE!');

          const outputPath = `${saveAndServeFilesDirectory}/${req.user.channelUrl}/${upload.uniqueTag}.vtt`;

          // convert the srt to vtt
          await convertPromise(webVttPath, outputPath);
          console.log('apparently done converting');

          // TODO: does it delete the old file or should I delete it?

        }

      } else if(subtitlefileExtension == '.vtt'){
        /**  the file in the directory  **/
        const pathToSaveTo = `${saveAndServeFilesDirectory}/${req.user.channelUrl}/${upload.uniqueTag}.vtt`;

        /**  save the VTT to the directory and mark it on the upload document **/
        await fs.move(webVttPath, pathToSaveTo, {overwrite: true});
      }

      upload.webVTTPath = `${upload.uniqueTag}.vtt`;
    }

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

/**
 * POST /api/upload/:uniqueTag/captions/delete
 * Remove the captions from an upload
 */
exports.deleteUploadCaption = async(req, res) => {
  try {
    console.log(req.body.uploadToken);

    // if there's no req.user then load it as if there was one from the upload token
    if(!req.user && req.body.uploadToken){
      req.user = await User.findOne({ uploadToken : req.body.uploadToken });
    }

    // req.params coming from the api route that's hit
    // get the upload per the unique tag
    const upload = await Upload.findOne({ uniqueTag: req.params.uniqueTag }).populate('uploader');

    // if there's no upload send 'no upload'
    if(!upload){
      res.send('no upload');
    }

    // TODO: does this work for admins?

    // only work if the uploader id and req user id are the same
    // otherwise send 'not authenticated'
    if(upload.uploader.id.toString() !== req.user.id.toString()){
      res.send('not authenticated');
    }

    upload.webVTTPath = undefined;
    await upload.save();

    res.send('success');

    console.log(req.body);
  } catch(err){
    console.log(err);
  }

};

/** handle last watched time per user and upload **/
exports.updateLastWatchedTime = async(req, res, next)  => {

  // console.log(req.body);

  // console.log(`${req.user._id}` , req.params.user);

  const secondsWatched = req.body.secondsWatched;
  const uploadUniqueTag = req.body.uniqueTag;

  const user = req.user._id;

  const upload = await Upload.findOne({
    uniqueTag : req.body.uniqueTag
  });

  const uploadId = upload._id;

  // find an existing react per that user and upload
  let existingLastWatchedTime = await LastWatchedTime.findOne({
    uploadUniqueTag,
    user
  });

  if(existingLastWatchedTime){

    existingLastWatchedTime.secondsWatched = secondsWatched;

    await existingLastWatchedTime.save();

    res.send('last watched time updated');

    // if there's already an uploaded time
  } else {

    console.log('no saved watched time for this user and and upload');

    const newLastWatchedTime = new LastWatchedTime({
      upload: uploadId,
      user: req.user._id,
      uploadUniqueTag: upload.uniqueTag,
      secondsWatched
    });

    await newLastWatchedTime.save();

    res.send('new watch time created');
  }
};

exports.savePushEndpoint = async function(req, res, next){

  console.log(req.user);
  // console.log(req);

  const userAgent = req.get('User-Agent');

  console.log(userAgent);

  let existingPushEndpoint = await PushEndpoint.findOne({
    user: req.user,
    subscription: req.body,
    userAgent,
    expired: false
  });

  if(!existingPushEndpoint){
    let pushEndpoint = new PushEndpoint({
      user : req.user,
      subscription : req.body,
      userAgent,
      expired: false
    });

    console.log(pushEndpoint);

    await pushEndpoint.save();
  }

  res.send('success');

};

exports.subscribeToEmailNotifications = async function(req, res, next){
  // user who is subscribing
  const user = req.body.user;

  const subscribingUser = await User.findOne({ channelUrl: user });

  const channel = req.body.channel;

  const foundUser = await User.findOne({ channelUrl: channel });

  console.log(foundUser.channelUrl);

  console.log(subscribingUser.channelUrl);

  // channel url of who is being subscribed to

  let existingActiveEmailSubscription = await EmailSubscription.findOne({ subscribingUser, subscribedToUser: foundUser, active: true });

  let responseText;

  // already exists and turned on, turn it off
  if(existingActiveEmailSubscription){
    responseText = 'already active, turn it off';
    console.log(responseText);
    existingActiveEmailSubscription.active = false;
    await existingActiveEmailSubscription.save();
  }

  // check if there's an inactive one, if not make a new one
  if(!existingActiveEmailSubscription){

    let existingInactiveEmailNotif = await EmailSubscription.findOne({ subscribingUser, subscribedToUser: foundUser, active: false });

    if(existingInactiveEmailNotif){
      responseText = 'already existing inactive, make it active';
      console.log(responseText);
      existingInactiveEmailNotif.active = true;
      await existingInactiveEmailNotif.save();
    } else {
      responseText = 'create a new email sub';

      console.log(responseText);
      let emailEndpoint = new EmailSubscription({
        subscribingUser,
        subscribedToUser: foundUser,
        active: true
      });

      // console.log(emailEndpoint);

      await emailEndpoint.save();
    }
  }

  res.send(responseText);

};

exports.subscribeToPushNotifications = async function(req, res, next){
  // user who is subscribing
  const user = req.body.user;

  const subscribingUser = await User.findOne({ channelUrl: user });

  const channel = req.body.channel;

  const foundUser = await User.findOne({ channelUrl: channel });

  console.log(foundUser.channelUrl);

  console.log(subscribingUser.channelUrl);

  // channel url of who is being subscribed to

  let existingActivePushSubscription = await PushSubscription.findOne({ subscribingUser, subscribedToUser: foundUser, active: true });

  let responseText;

  // already exists and turned on, turn it off
  if(existingActivePushSubscription){
    responseText = 'already active, make it inactive';
    console.log(responseText);
    existingActivePushSubscription.active = false;
    await existingActivePushSubscription.save();
  }

  // check if there's an inactive one, if not make a new one
  if(!existingActivePushSubscription){

    let existingInactivePushNotif = await PushSubscription.findOne({ subscribingUser, subscribedToUser: foundUser, active: false });

    if(existingInactivePushNotif){
      responseText = 'already existing inactive, make it active';
      console.log(responseText);
      existingInactivePushNotif.active = true;
      await existingInactivePushNotif.save();
    } else {
      responseText = 'create a new push sub';

      console.log(responseText);
      let pushEndpoint = new PushSubscription({
        subscribingUser,
        subscribedToUser: foundUser,
        active: true
      });

      console.log(pushEndpoint);

      await pushEndpoint.save();
    }
  }

  res.send(responseText);

};

exports.sendUserPushNotifs = async function(req, res, next){
  if(req.user.role !== 'admin'){
    return res.send('die');
  }

  // user who is subscribing
  const channel = req.body.channel;

  const userToSendFor = await User.findOne({ channelUrl: channel });

  console.log(userToSendFor.channelUrl);

  // TODO: find all the PushSubscriptions where he is the subscribed to user, that are active
  // for each of those pushsubscriptions, populate the user
  // for each of those users, find their endpoints, and then webpush to them (active ones)

  await pushNotificationLibrary.sendPushNotifications();

  return res.send('hello');

  const subscriptions = await PushEndpoint.find({ expired : { $ne: true } });

  for(const subscription of subscriptions){
    console.log(subscription);
  }

  // channel url of who is being subscribed to

  // const existingPushSubscription = await PushSubscription.find({ subscribingUser, subscribedToUser: foundUser })
  //
  // if(!existingPushSubscription){
  //   let pushEndpoint = new PushSubscription({
  //     subscribingUser,
  //     subscribedToUser: foundUser
  //   });
  //
  //   console.log(pushEndpoint);
  //
  //   await pushEndpoint.save();
  // } else {
  //   console.log('already has an existing push subscription');
  // }

  res.send('success');

};

