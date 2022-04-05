const redisClient = require('../../config/redis');
const _ = require('lodash');
const Upload = require('../../models/index').Upload;
const AdminAction = require('../../models/index').AdminAction;
const User = require('../../models/index').User;
const Subscription = require('../../models/index').Subscription;
const React = require('../../models/index').React;
const Comment = require('../../models/index').Comment;
const SiteVisit = require('../../models/index').SiteVisit;
const pagination = require('../../lib/helpers/pagination');

const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');
const timeAgoEnglish = new javascriptTimeAgo('en-US');

const { uploadServer} = require('../../lib/helpers/settings');

const { attachDataToUploadsAsUploads } = require('../../lib/helpers/addFieldsToUploads');

let viewStats, uploadStats, userStats, reactStats, subscriptionStats, searchStats, commentStats, siteVisitStats;

async function getStats(){
  let views = await redisClient.getAsync('dailyStatsViews');
  let uploads = await redisClient.getAsync('dailyStatsUploads');
  let users = await redisClient.getAsync('dailyStatsUsers');
  let reacts = await redisClient.getAsync('dailyStatsReacts');
  let subscriptions = await redisClient.getAsync('dailyStatsSubscriptions');
  let siteVisits = await redisClient.getAsync('dailyStatsSiteVisits');
  let comments = await redisClient.getAsync('dailyStatsComments');
  let searches = await redisClient.getAsync('dailyStatsSearches');

  searchStats = JSON.parse(searches);
  commentStats = JSON.parse(comments);
  siteVisitStats = JSON.parse(siteVisits);
  userStats = JSON.parse(users);
  reactStats = JSON.parse(reacts);
  viewStats = JSON.parse(views);
  subscriptionStats = JSON.parse(subscriptions);
  uploadStats = JSON.parse(uploads);

}

getStats();
setInterval(function(){
  getStats();
}, 1000 * 60 * 1);

exports.dailyStats = async(req, res) => {

  let views = viewStats;
  let uploads = uploadStats;
  let users = userStats;
  let subscriptions = subscriptionStats;
  let reacts = reactStats;
  let searches = searchStats;
  let siteVisits = siteVisitStats;
  let comments = commentStats;

  const array = [views, uploads, users, subscriptions, reacts, searches, comments, siteVisits];

  res.render('admin/dailyStats', {
    title: 'Daily Stats',
    array
  });

};

exports.getAdminAudit = async(req, res) => {

  // exclude uploads without an uploadUrl

  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  try {
    let adminActions = await AdminAction.find({})
      .populate({path: 'adminOrModerator uploadsAffected usersAffected', populate: {path: 'uploader'}})
      .skip(skipAmount).limit(limit).lean().sort({ createdAt: -1 });

    // adminActions = adminActions.reverse();

    console.log(adminActions);

    res.render('admin/adminAudit', {
      title: 'Admin Audit',
      adminActions,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page
    });
  } catch(err){
    console.log(err);
    return res.render('error/500');
  }

};

exports.getPending = async(req, res) => {

  // exclude uploads without an uploadUrl
  let uploads = await Upload.find({
    visibility: 'pending'
  }).populate('uploader').lean();

  // no need to do anything crazy since this is an admin only view
  uploads = uploads.map(function(upload){

    upload.pathToUploader = `/user/${upload.uploader.channelUrl}`;

    console.log(upload.pathToUploader);

    return upload;
  });

  uploads = _.sortBy(uploads, [function(c){ return c.createdAt; }]).reverse();

  res.render('moderator/pending', {
    title: 'Pending',
    uploads,
    uploadServer,
    timeAgoEnglish
  });

};

exports.getSiteVisitorHistory = async(req, res) => {

  const id = req.params.id;

  console.log(id);

  const visitor = await SiteVisit.findOne({ _id : id }).populate('user');

  console.log(visitor);

  res.render('admin/siteVisitorHistory', {
    title: 'Site Visitor History',
    visitor
  });

};

exports.getSiteVisitors = async(req, res) => {
  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  try {
    const visitors = await SiteVisit.find({}).sort({ _id : -1  }).populate('user').skip(skipAmount).limit(limit);

    res.render('admin/siteVisitors', {
      title: 'Site Visitors',
      visitors,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page
    });
  } catch(err){
    console.log(err);
    return res.render('error/500');
  }

};

exports.getUploads = async(req, res) => {

  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  try {
    const uploads = await Upload.find({}).sort({ _id : -1  }).populate('uploader').skip(skipAmount).limit(limit);

    res.render('admin/uploads', {
      title: 'Uploads',
      uploads,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page
    });
  } catch(err){
    console.log(err);
    return res.render('error/500');
  }

};

exports.getComments = async(req, res) => {
  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  let { visibility } = req.query;

  if(!visibility) visibility = 'all'

  let searchQuery = {};

  if(visibility !== 'all'){
    searchQuery.visibility = visibility;
  }

  console.log('visibility')
  console.log(visibility);

  try {
    const comments = await Comment.find(searchQuery).sort({ _id : -1  }).populate('commenter upload')
      .skip(skipAmount).limit(limit);

    res.render('admin/comments', {
      title: 'Comments',
      comments,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page,
      visibility: visibility
    });
  } catch(err){
    console.log('err');
    console.log(err);
  }

};

exports.getNotificationPage = async(req, res) => {
  return res.render('admin/notifications', {});
};

exports.getUsers = async(req, res) => {

  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  const populateString = 'user sender upload react comment';

  const { email, channelUrl, stripeCustomerId } = req.query;

  let searchQuery = {};

  if(email){
    searchQuery.email = email;
  }

  if(channelUrl){
    searchQuery.channelUrl = channelUrl;
  }

  if(stripeCustomerId){
    searchQuery.stripeCustomerId = stripeCustomerId;
  }

  console.log(email);

  try {
    const users = await User.find(searchQuery)
      .populate(populateString)
      .skip(skipAmount)
      .limit(limit)
      .sort({ _id : -1  });

    // console.log("users: ")
    // console.log(users);

    res.render('admin/users', {
      title: 'Users',
      users,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page
    });
  } catch(err){
    console.log(err);
    return res.render('error/500');
  }

};

exports.reacts = async(req, res) => {

  if(!req.user){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  if(req.user.role !== 'admin'){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  try {
    const reacts = await React.find({}).populate({path: 'user upload', populate: {path: 'uploader'}})
      .skip(skipAmount).limit(limit).sort({ _id : -1  });

    // console.log(reacts);

    return res.render('admin/reacts', {
      title : 'Admin Reacts',
      reacts,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page
    });
  } catch(err){
    console.log(err);
    return res.render('error/500');
  }

};

exports.subscriptions = async(req, res) => {

  if(!req.user){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  if(req.user.role !== 'admin'){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 100;
  const skipAmount = (page * limit) - limit;

  const { startingNumber, previousNumber, nextNumber, numbersArray } = pagination.buildPaginationObject(page);

  try {
    const subscriptions = await Subscription.find({})
      .populate({path: 'subscribingUser subscribedToUser drivingUpload', populate: {path: 'uploader'}})
      .skip(skipAmount).limit(limit).sort({ _id : -1  });

    // console.log(subscriptions);

    return res.render('admin/subscriptions', {
      title : 'Admin Reacts',
      subscriptions,
      startingNumber,
      previousNumber,
      nextNumber,
      numbersArray,
      highlightedNumber: page
    });
  } catch(err){
    console.log(err);
    return res.render('error/500');
  }

};

exports.getAdminOverview = async(req, res) => {
  return res.render('admin/adminOverview', {});
};
