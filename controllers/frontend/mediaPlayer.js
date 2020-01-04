const _ = require('lodash');

const redisClient = require('../../config/redis');

const pagination = require('../../lib/helpers/pagination');

const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const Comment = require('../../models/index').Comment;
const View = require('../../models/index').View;
const SiteVisit = require('../../models/index').SiteVisit;
const React = require('../../models/index').React;
const Notification = require('../../models/index').Notification;
const SocialPost = require('../../models/index').SocialPost;
const Subscription = require('../../models/index').Subscription;
const Report = require('../../models/index').Report;

const uploadHelpers = require('../../lib/helpers/settings');

const categories = require('../../config/categories');

const uploadServer  = uploadHelpers.uploadServer;

const generateComments = require('../../lib/mediaPlayer/generateCommentsObjects');
const generateReactInfo = require('../../lib/mediaPlayer/generateReactInfo');

console.log('UPLOAD SERVER: ' + uploadServer);

function getParameterByName(name, url){
  if(!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if(!results)return null;
  if(!results[2])return'';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const mongooseHelpers = require('../../caching/mongooseHelpers');

/**
 * GET /$user/$uploadUniqueTag
 * Media player page
 */
exports.getMedia = async(req, res) => {

  console.log('getting media');

  const stripeToken = process.env.STRIPE_FRONTEND_TOKEN || 'pk_test_iIpX39D0QKD1cXh5CYNUw69B';

  let emojis = ['like', 'dislike', 'laugh', 'sad', 'disgust', 'love'];

  try {

    // channel id and file name
    const channel = req.params.channel;
    const media = req.params.media;

    let upload = await Upload.findOne({
      uniqueTag: media
    }).populate({path: 'uploader comments checkedViews blockedUsers', populate: {path: 'commenter'}}).exec();

    const userIsAdmin = req.user && req.user.role == 'admin';

    // if there is no upload, or upload is deleted and user is not admin
    if(!upload || ( upload.visibility == 'removed' && !userIsAdmin)){
      console.log('Visible upload not found');
      res.status(404);
      return res.render('error/404');
    }

    let subscriberAmount = await Subscription.count({subscribedToUser: upload.uploader._id, active: true});
    // console.log(subscriberAmount);

    let subscriptions = req.user ? await Subscription.count({subscribedToUser: upload.uploader._id, subscribingUser: req.user._id, active: true}) : 0;
    let alreadySubbed = (subscriptions > 0) ? true : false;
    /* let subscriptions = await Subscription.find({ subscribedToUser: upload.uploader._id, active: true });

    let alreadySubbed = false;
    // determine if user is subbed already
    if(req.user && subscriptions){
      for(let subscription of subscriptions){
        if(subscription.subscribingUser.toString() == req.user._id.toString()){
          alreadySubbed = true
        }
      }
    }
    */

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

    const legitViews = _.filter(upload.checkedViews, function(view){
      return view.validity == 'real';
    });

    // assuming we always have a site visitor
    const userFakeViews = _.filter(upload.checkedViews, function(view){
      return( view.siteVisitor.toString() == req.siteVisitor._id.toString() ) && view.validity == 'fake';
    });

    /** FRAUD CALCULATION, SHOULD PULL OUT INTO OWN LIBRARY **/
    let doingFraud;
    if(process.env.CUSTOM_FRAUD_DETECTION == 'true'){
      const testIfViewIsLegitimate = require('../../lib/custom/fraudPrevention').testIfViewIsLegitimate;

      doingFraud = await testIfViewIsLegitimate(upload, req.siteVisitor._id);
    } else {
      doingFraud = false;
    }

    /** FRAUDULENT VIEW CHECK **/
    // do a legitimacy check here
    if(!doingFraud){

      const view = new View({
        siteVisitor : req.siteVisitor._id,
        upload : upload._id,
        validity: 'real'
      });

      await view.save();
      upload.checkedViews.push(view);

      // console.log(upload);
      await upload.save();
    } else {

      const view = new View({
        siteVisitor : req.siteVisitor._id,
        upload : upload._id,
        validity: 'fake'
      });

      await view.save();
      upload.checkedViews.push(view);

      req.siteVisitor.doneFraud = true;
      await req.siteVisitor.save();

      // console.log(upload);
      await upload.save();
    }

    const comments = await generateComments(upload);

    let commentCount = 0;
    for(const comment of comments){
      commentCount++;
      for(const response of comment.responses){
        commentCount++;
      }
    }

    const reactInfo = await generateReactInfo(upload, req.user);

    const emojis = reactInfo.emojis;

    const currentReact = reactInfo.currentReact;

    upload.views = upload.views + legitViews.length + userFakeViews.length;

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

    } else {

      // document is fine to be shown publicly

      /** SET META TAGS **/
      res.locals.meta.title = `${upload.title}`;

      res.locals.meta.description = upload.description || 'Hosted on PewTube';

      if(upload.fileType == 'video'){
        res.locals.meta.image = upload.customThumbnailUrl || upload.thumbnailUrl;
        res.locals.meta.video = upload.uploadUrl;
      }

      const url = req.protocol + '://' + req.get('host') + req.originalUrl;

      let alreadyReported;
      // need to add the upload
      let reportForSiteVisitor = await Report.findOne({ reportingSiteVisitor : req.siteVisitor, upload: upload._id  }).hint('Report For Site Visitor');
      let reportForReportingUser = await Report.findOne({ reportingUser : req.user, upload: upload._id }).hint('Report For User');

      if(reportForReportingUser || reportForSiteVisitor){
        alreadyReported = true;
      } else {
        alreadyReported = false;
      }

      const blockedUsers = upload.uploader.blockedUsers;

      let viewingUserIsBlocked = false;
      if(req.user){
        const viewingUserId = req.user._id;

        for(const blockedUser of blockedUsers){
          if(blockedUser.toString() == viewingUserId) viewingUserIsBlocked = true;
        }
      }

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
        viewingUserIsBlocked
      });
    }

  } catch(err){

    console.log(err);

    res.status(500);
    res.render('error/500');
  }

};

