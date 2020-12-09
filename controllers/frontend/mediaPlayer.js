const moment = require('moment');

const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;
const View = require('../../models/index').View;
const Subscription = require('../../models/index').Subscription;
const PushSubscription = require('../../models/index').PushSubscription;
const EmailSubscription = require('../../models/index').EmailSubscription;
const LastWatchedTime = require('../../models/index').LastWatchedTime;

const timeHelper = require('../../lib/helpers/time');

const uploadHelpers = require('../../lib/helpers/settings');

const checkWhetherToCountView = require('../../middlewares/shared/viewCounting');

const { bytesToGb, bytesToMb } = require('../../lib/uploading/helpers');

const categories = require('../../config/categories');

let uploadServer  = uploadHelpers.uploadServer;

const _ = require('lodash');

const generateComments = require('../../lib/mediaPlayer/generateCommentsObjects');
const generateReactInfo = require('../../lib/mediaPlayer/generateReactInfo');
const { saveMetaToResLocal } = require('../../lib/mediaPlayer/generateMetatags');
const hideUpload = require('../../lib/mediaPlayer/detectUploadVisibility');

console.log(`UPLOAD SERVER: ${uploadServer}\n`);

const brandName = process.env.INSTANCE_BRAND_NAME;

function getParameterByName(name, url){
  if(!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if(!results)return null;
  if(!results[2])return'';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function convertAllAgesToSfw(value){
  if(value == 'allAges'){
    return'SFW';
  } else if(value == 'mature'){
    return'NSFW';
  }
}

const secondsToFormattedTime = timeHelper.secondsToFormattedTime;

const stripeToken = process.env.STRIPE_FRONTEND_TOKEN || 'pk_test_iIpX39D0QKD1cXh5CYNUw69B';

function getFormattedFileSize(upload){
  const fileSizeInMb = upload.processedFileSizeInMb || upload.originalFileSizeInMb || bytesToMb(upload.fileSize);

  let formattedFileSizeString;

  // if it's under one gig,
  if(fileSizeInMb < 1000){
    formattedFileSizeString = _.round(fileSizeInMb) + ' MB';
  } else {
    formattedFileSizeString  = _.round(fileSizeInMb/1000, 1) + ' GB';
  }

  return formattedFileSizeString;
}

/**
 * GET /$user/$uploadUniqueTag
 * Media player page
 */
exports.getMedia = async(req, res) => {

  // get the amount of slashes, to determine if the user is allowed
  // to access the vanity url version of this url
  let requestPath = req.path;

  if(requestPath.charAt(requestPath.length - 1) == '/'){
    requestPath = requestPath.substr(0, requestPath.length - 1);
  }

  const amountOfSlashes = requestPath.split('/').length - 1;

  try {

    // channel id and file name
    const channel = req.params.channel;
    const media = req.params.media;
    let user = await User.findOne({
      // regex for case insensitivity
      channelUrl:  new RegExp(['^', req.params.channel, '$'].join(''), 'i')
    }).populate('receivedSubscriptions').lean()
      .exec();

    let upload = await Upload.findOne({
      uniqueTag: media
    }).populate({
      path: 'uploader comments blockedUsers',
      populate: {
        path: 'commenter'
      }
    }).exec();

    if(!user && upload){
      user = await User.findOne({
        _id : upload.uploader
      });
    }

    // indicates a 'shortened' media player url, if not plus spit out
    if(amountOfSlashes === 2 && user.plan !== 'plus'){
      res.status(404);
      return res.render('error/404', {
        title: 'Not Found'
      });
    }

    // TODO: make sure to add query params here
    // if it's three but you're plus, then move to shortened url
    if(amountOfSlashes === 3 && user.plan == 'plus'){
      return res.redirect(`/${user.channelUrl}/${upload.uniqueTag}`);
    }

    // TODO: pull this thing out
    /** * PUSH NOTIFICATION SECTION **/
    let existingPushSub;
    let existingEmailSub;
    let pushSubscriptionSearchQuery;

    // test if push notif and emails are already activated per viewing user
    if(req.user && user){
      pushSubscriptionSearchQuery = {
        subscribedToUser :  user._id,
        subscribingUser: req.user._id,
        active: true
      };
      existingPushSub = await PushSubscription.findOne(pushSubscriptionSearchQuery);

      existingEmailSub = await EmailSubscription.findOne(pushSubscriptionSearchQuery);
    }

    // if the user already has push notis turned on
    const alreadyHavePushNotifsOn = Boolean(existingPushSub);

    const alreadySubscribedForEmails = Boolean(existingEmailSub);

    // console.log("alreadyHavePushNotifsOn: ")
    // console.log(alreadyHavePushNotifsOn);
    //
    // console.log("alreadySubscribedForEmails: ")
    // console.log(alreadySubscribedForEmails);
    /** * PUSH NOTIFICATION SECTION **/

    // even though this is named 'hide upload' it should really be named return 404
    // because it will return true even if there is no upload
    const return404 = hideUpload(upload, req.user, res);

    if(return404){
      res.status(404);
      return res.render('error/404', {
        title: 'Not Found'
      });
    }

    // either use viral server, the uploadServer on the document or the general uploadServer
    const serverToUse = upload.viralServerOn && upload.viralServer || upload.uploadServer || uploadServer;

    /** determine relationship between current viewer and upload **/
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

    // TODO: pull in actual functionality
    alreadyReported = false;
    viewingUserIsBlocked = false;

    /** calculate info to show to frontend **/
    // amount of total subs
    let subscriberAmount = await Subscription.countDocuments({subscribedToUser: upload.uploader._id, active: true});

    // calculate if viewer has is subbed
    let subscriptions = req.user ? await Subscription.countDocuments({subscribedToUser: upload.uploader._id, subscribingUser: req.user._id, active: true}) : 0;
    let alreadySubbed = subscriptions > 0;

    const { comments, commentCount } = await generateComments(upload._id);

    const reactInfo = await generateReactInfo(upload, req.user);

    const emojis = reactInfo.emojis;

    const currentReact = reactInfo.currentReact;

    upload.views = await View.countDocuments({
      upload: upload.id
    });

    const siteVisitorId = req.siteVisitor._id;
    const uploadID = upload._id;

    const shouldCreateAView = await checkWhetherToCountView(siteVisitorId, uploadID);

    // console.log(shouldCreateAView);

    if(shouldCreateAView){
      // get all the views for this upload for this user
      // TODO: add a rule to only get the last 24h of worth of views
      const view = new View({
        siteVisitor : req.siteVisitor._id,
        upload : upload._id,
        validity: 'real'
      });

      await view.save();

      await Upload.findOneAndUpdate({ uniqueTag: media },
        {$push: { checkedViews: view._id}},
        {new: true});
    }

    // originalFileSizeInMb: Number,
    // processedFileSizeInMb: Number,

    const formattedFileSize = getFormattedFileSize(upload);

    // document is fine to be shown publicly

    // for the copy buttons and sharing buttons
    const url = req.protocol + '://' + req.get('host') + req.originalUrl;

    saveMetaToResLocal(upload, uploadServer, req, res);

    const convertedRating = convertAllAgesToSfw(upload.rating);
    // console.log(convertedRating);

    let lastWatchedTime;
    let formattedLastWatchedTime;
    if(req.user){
      lastWatchedTime = await LastWatchedTime.findOne({
        user : req.user._id,
        upload: upload._id
      });

      if(lastWatchedTime){
        formattedLastWatchedTime = timeHelper.secondsToFormattedTime(Math.round(lastWatchedTime.secondsWatched));
      }

    }

    let uploadFps;
    if(upload.ffprobeData){
      // console.log('running here!');

      const videoStream =  upload.ffprobeData.streams.filter(stream => {
        return stream.codec_type == 'video';
      });

      // console.log(videoStream);

      if(videoStream && videoStream[0]){
        uploadFps = videoStream[0].avg_frame_rate || videoStream[0].r_frame_rate ;
      }

      // console.log(videoStream);

    }

    const viewingUser = req.user;

    const viewingUserHasConfirmedEmail = viewingUser && viewingUser.email && viewingUser.emailConfirmed;

    // TODO: to bugfix if the user is wrong, perhaps better to just get the user

    let amountOfPushSubscriptions;
    let amountOfEmailSubscriptions;

    if(user){
      amountOfPushSubscriptions = await PushSubscription.count({ subscribedToUser :  user._id, active: true });

      amountOfEmailSubscriptions = await EmailSubscription.count({ subscribedToUser :  user._id, active: true });

    }

    const uploadedAtTime = moment(upload.processingCompletedAt).format('MMMM Do YYYY');

    res.render('media', {
      title: upload.title,
      comments : comments.reverse(),
      upload,
      channel,
      media,
      isUser,
      isAdmin,
      emojis,
      currentReact,
      subscriberAmount,
      alreadySubbed,
      url,
      commentCount,
      uploadServer,
      stripeToken,
      alreadyReported,
      categories,
      isUserOrAdmin,
      isUploaderOrAdmin,
      isUploader,
      getParameterByName,
      viewingUserIsBlocked,
      brandName,
      secondsToFormattedTime,
      formattedFileSize,
      domainName: process.env.DOMAIN_NAME_AND_TLD,
      serverToUse,
      convertedRating,
      lastWatchedTime,
      formattedLastWatchedTime,
      uploadFps,
      alreadyHavePushNotifsOn,
      alreadySubscribedForEmails,
      viewingUserHasConfirmedEmail,
      amountOfPushSubscriptions,
      amountOfEmailSubscriptions,
      uploadedAtTime,
      requestPath
    });

  } catch(err){

    console.log(err);

    res.status(500);
    res.render('error/500');
  }

};

