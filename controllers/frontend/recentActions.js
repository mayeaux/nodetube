const pagination = require('../../lib/helpers/pagination');
const _ = require('lodash');

const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const Comment = require('../../models/index').Comment;
const View = require('../../models/index').View;
const SiteVisit = require('../../models/index').SiteVisit;
const React = require('../../models/index').React;
const Notification = require('../../models/index').Notification;
const SocialPost = require('../../models/index').SocialPost;
const Subscription = require('../../models/index').Subscription;

const uploadHelpers = require('../../lib/helpers/settings');

const uploadServer = uploadHelpers.uploadServer;

/**
 * GET /media/recentComments
 * Recent comments
 */
exports.recentComments = async (req, res) => {
  let page = req.params.page;

  if(!page){
    page = 1;
  }

  page = parseInt(page);

  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  try {
    let comments = await Comment.find({
      visibility: { $ne: 'removed' }
    }).populate({ path: 'upload commenter', populate: { path: 'uploader' } })
      .sort({ createdAt: -1 })
      .skip((page * limit) - limit)
      .limit(limit);

    // delete comments from videos that arent public
    comments = _.filter(comments, comment => comment.upload && comment.upload.visibility == 'public');

    res.render('public/recentReacts', {
      title: 'Recent Comments',
      comments,
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber,
      uploadServer,
      documents: comments,
      recentActionDisplayName: 'Recent Comments'
    });
  } catch(err){
    console.log(err);
    res.send('ERR');
  }
};

/**
 * GET /media/recentComments
 * Recent reacts
 */
exports.recentReacts = async (req, res) => {
  let page = req.params.page;

  if(!page){
    page = 1;
  }
  page = parseInt(page);

  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  const recentAction = 'recentReacts';

  let reacts = await React.find({

  }).populate({ path: 'upload user', populate: { path: 'uploader' } })
    .sort({ createdAt: -1 })
    .skip((page * limit) - limit)
    .limit(limit);

  reacts = _.filter(reacts, react => react.upload.visibility == 'public' && react.upload.status !== 'processing');

  res.render('public/recentReacts', {
    title: 'Recent Reacts',
    reacts,
    numbersArray,
    highlightedNumber: page,
    previousNumber,
    nextNumber,
    recentAction,
    uploadServer,
    documents: reacts,
    recentActionDisplayName: 'Recent Reacts'
  });
};

/**
 * GET /media/recentViews
 * Organize uploads by most recently viewed
 */
exports.recentViews = async (req, res) => {
  let page = req.params.page;

  if(!page){
    page = 1;
  }

  page = parseInt(page);

  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  let views = await View.find({
    validity: 'real'
  }).populate({ path: 'upload', populate: { path: 'uploader' } })
    .sort({ createdAt: -1 })
    .skip((page * limit) - limit)
    .limit(limit);

  views = _.filter(views, view => view.upload.visibility == 'public' && view.upload.status !== 'processing');

  res.render('public/recentReacts', {
    title: 'Recent Views',
    views,
    numbersArray,
    highlightedNumber: page,
    previousNumber,
    nextNumber,
    uploadServer,
    documents: views,
    recentActionDisplayName: 'Recent Views'
  });
};
