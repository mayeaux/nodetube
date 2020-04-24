const Upload = require('../../models/index').Upload;
const View = require('../../models/index').View;
const Subscription = require('../../models/index').Subscription;
const timeHelper = require('../../lib/helpers/time');

const uploadHelpers = require('../../lib/helpers/settings');

const checkWhetherToCountView = require('../../middlewares/shared/viewCounting');

const { bytesToGb, bytesToMb } = require('../../lib/uploading/helpers');

const categories = require('../../config/categories');

let uploadServer  = uploadHelpers.uploadServer;

const _ = require('lodash');

const generateComments = require('../../lib/mediaPlayer/generateCommentsObjects');
const generateReactInfo = require('../../lib/mediaPlayer/generateReactInfo');
const saveMetaToResLocal = require('../../lib/mediaPlayer/generateMetatags');
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

const secondsToFormattedTime = timeHelper.secondsToFormattedTime;

const stripeToken = process.env.STRIPE_FRONTEND_TOKEN || 'pk_test_iIpX39D0QKD1cXh5CYNUw69B';

function getFormattedFileSize(upload){
  const fileSizeInMb = upload.originalFileSizeInMb || upload.processedFileSizeInMb || bytesToMb(upload.fileSize);

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

  try {

    // channel id and file name
    const channel = req.params.channel;
    const media = req.params.media;

    let upload = await Upload.findOne({
      uniqueTag: media
    }).populate({path: 'uploader comments blockedUsers', populate: {path: 'commenter'}}).exec();

    // even though this is named 'hide upload' it should really be named return 404
    // because it will return true even if there is no upload
    const return404 = hideUpload(upload, req.user, res);

    if(return404){
      res.status(404);
      return res.render('error/404', {
        title: 'Not Found'
      });
    }

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
      upload.checkedViews.push(view);

      // console.log(upload);
      await upload.save();
    }

    // originalFileSizeInMb: Number,
    // processedFileSizeInMb: Number,

    const formattedFileSize = getFormattedFileSize(upload);

    // document is fine to be shown publicly

    // for the copy buttons and sharing buttons
    const url = req.protocol + '://' + req.get('host') + req.originalUrl;

    saveMetaToResLocal(upload, uploadServer, req, res);

    res.render('media', {
      title: upload.title,
      comments,
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
      domainName: process.env.DOMAIN_NAME_AND_TLD
    });

  } catch(err){

    console.log(err);

    res.status(500);
    res.render('error/500');
  }

};

