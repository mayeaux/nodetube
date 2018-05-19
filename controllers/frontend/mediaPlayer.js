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

console.log('UPLOAD SERVER: ' + uploadServer);

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}


const mongooseHelpers = require('../../caching/mongooseHelpers');


/**
 * GET /$user/$uploadUniqueTag
 * Media player page
 */
exports.getMedia = async (req, res) => {

  const stripeToken = process.env.STRIPE_FRONTEND_TOKEN || 'pk_test_iIpX39D0QKD1cXh5CYNUw69B';

  let emojis = ['like', 'dislike', 'laugh', 'sad', 'disgust', 'love'];

  try {

    // channel id and file name
    const channel = req.params.channel;
    const media = req.params.media;


    let upload = await Upload.findOne({
      uniqueTag: media,
    }).populate({path: 'uploader comments checkedViews', populate: {path: 'commenter'}}).exec();

    const userIsAdmin = req.user && req.user.role == 'admin';

    // if there is no upload, or upload is deleted and user is not admin
    if(!upload || ( upload.visibility == 'removed' && !userIsAdmin)){
      console.log('Visible upload not found');
      res.status(404);
      return res.render('error/404')
    }

    let subscriberAmount = await Subscription.count({subscribedToUser: upload.uploader._id, active: true});
    // console.log(subscriberAmount);


    /** COMMENTS **/

    let commentsWithResponsesPopulated = [];

    // populating the comments' responses
    for(comment of upload.comments){
      let newThing = await Comment.findOne({ _id : comment.id }).populate({path: 'responses commenter', populate: {path: 'commenter'}});
      // console.log(newThing);
      commentsWithResponsesPopulated.push(newThing)
    }

    // remove removed comments
    commentsWithResponsesPopulated = _.filter(commentsWithResponsesPopulated, function(comment){
      return comment.visibility == 'public'
    });

    // remove comments that are responses (they will already be listed)
    commentsWithResponsesPopulated = _.filter(commentsWithResponsesPopulated, function(comment){
      return !comment.inResponseTo
    });

    let subscriptions = req.user ? await Subscription.count({subscribedToUser: upload.uploader._id, subscribingUser: req.user._id, active: true}) : 0
    let alreadySubbed = (subscriptions > 0) ? true : false;
    /*let subscriptions = await Subscription.find({ subscribedToUser: upload.uploader._id, active: true });

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


    // TODO: A better implementation is in branches 'server-down' and 'nov-25'
    let userReact;
    if(req.user){
      userReact = await React.findOne({ upload: upload._id, user: req.user._id });
    }

    let likeAmount = await React.count({ react: 'like', upload: upload._id });
    let dislikeAmount = await React.count({ react: 'dislike', upload: upload._id });
    let laughAmount = await React.count({ react: 'laugh', upload: upload._id });
    let sadAmount  = await React.count({ react: 'sad', upload: upload._id });
    let disgustAmount  = await React.count({ react: 'disgust', upload: upload._id });
    let loveAmount = await React.count({ react: 'love', upload: upload._id });

    let currentReact;
    if(userReact){
      currentReact = userReact.react
    } else {
      currentReact = undefined;
    }

    emojis = {
      like: {
        name: 'like',
        amount: likeAmount
      },
      dislike: {
        name: 'dislike',
        amount: dislikeAmount

      },
      laugh: {
        name: 'laugh',
        amount: laughAmount
      },
      sad: {
        name: 'sad',
        amount: sadAmount
      },
      disgust: {
        name: 'disgust',
        amount: disgustAmount
      },
      love: {
        name: 'love',
        amount: loveAmount
      },
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

    const legitViews = _.filter(upload.checkedViews, function(view){
      return view.validity == 'real'
    });

    // assuming we always have a site visitor
    const userFakeViews = _.filter(upload.checkedViews, function(view){
      return ( view.siteVisitor.toString() == req.siteVisitor._id.toString() ) && view.validity == 'fake';
    });


    /** FRAUD CALCULATION, SHOULD PULL OUT INTO OWN LIBRARY **/
    let doingFraud;
    if(process.env.CUSTOM_FRAUD_DETECTION == 'true'){
      const testIfViewIsLegitimate = require('../../lib/custom/fraudPrevention').testIfViewIsLegitimate;

      doingFraud = await testIfViewIsLegitimate(upload, req.siteVisitor._id)
    } else {
      doingFraud = false
    }

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



    upload.views = upload.views + legitViews.length + userFakeViews.length;

    // filter out removed comments *AND* comments that are responses
    upload.comments = _.filter(upload.comments, function(comment){
      return comment.visibility !== 'removed' && !comment.inResponseTo
    });

    // if upload should only be visible to logged in user
    if (upload.visibility == 'pending' || upload.visibility == 'private'){

      if(!req.user){
        res.status(404);
        return res.render('error/404')
      }

      // if the requesting user id matches upload's uploader id
      const isUsersDocument = req.user._id.toString() == upload.uploader._id.toString();

      // if its not the user's document and the user is not admin
      if(!isUsersDocument && ( req.user.role !== 'admin' && req.user.role !== 'moderator' )){
        res.status(404);
        return res.render('error/404')
      }

      // if is user's document or requesting user is admin
      if(isUsersDocument || req.user.role == 'admin'){
        res.render('media', {
          title: upload.title,
          comments: upload.comments,
          upload,
          channel,
          media
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

      let commentCount = 0;
      for(const comment of commentsWithResponsesPopulated){
        commentCount++;
        for(const response of comment.responses){
          commentCount++;
        }
      }

      let alreadyReported;
      // need to add the upload
      let reportForSiteVisitor = await Report.findOne({ reportingSiteVisitor : req.siteVisitor, upload: upload._id  }).hint("Report For Site Visitor");
      let reportForReportingUser = await Report.findOne({ reportingUser : req.user, upload: upload._id }).hint("Report For User");

      if(reportForReportingUser || reportForSiteVisitor){
        alreadyReported = true
      } else {
        alreadyReported = false;
      }

      res.render('media', {
        title: upload.title,
        comments: commentsWithResponsesPopulated,
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
        getParameterByName
      });
    }



  } catch (err){

    console.log(err);

    res.status(500);
    res.render('error/500')
  }

};

