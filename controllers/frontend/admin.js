const redisClient = require('../../config/redis');
const _ = require('lodash');

const Upload = require('../../models/index').Upload;
const AdminAction = require('../../models/index').AdminAction;
const User = require('../../models/index').User;
const Subscription = require('../../models/index').Subscription;
const React = require('../../models/index').React;
const Comment = require('../../models/index').Comment;
const SiteVisit = require('../../models/index').SiteVisit;
const SearchQuery = require('../../models/index').SearchQuery;

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

  let adminActions = await AdminAction.find({}).populate({path: 'adminOrModerator uploadsAffected usersAffected', populate: {path: 'uploader'}}).lean();

  adminActions = adminActions.reverse();

  console.log(adminActions);

  res.render('admin/adminAudit', {
    title: 'Admin Audit',
    adminActions
  });

};

exports.getPending = async(req, res) => {

  // exclude uploads without an uploadUrl
  let uploads = await Upload.find({
    visibility: 'pending'
  }).populate('uploader').lean();

  uploads = _.sortBy(uploads, [function(c){ return c.createdAt; }]).reverse();

  res.render('moderator/pending', {
    title: 'Pending',
    uploads
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

  const visitors = await SiteVisit.find({}).sort({ _id : -1  }).populate('user');

  res.render('admin/siteVisitors', {
    title: 'Site Visitors',
    visitors
  });

};

exports.getUploads = async(req, res) => {

  const uploads = await Upload.find({}).sort({ _id : -1  }).populate('uploader');

  res.render('admin/uploads', {
    title: 'Uploads',
    uploads
  });

};

exports.getComments = async(req, res) => {

  const comments = await Comment.find({}).sort({ _id : -1  }).populate('commenter upload');

  res.render('admin/comments', {
    title: 'Comments',
    comments
  });

};

exports.getNotificationPage = async(req, res) => {
  return res.render('admin/notifications', {});
};

exports.getUsers = async(req, res) => {

  const users = await User.find({}).sort({ _id : -1  });

  res.render('admin/users', {
    title: 'Users',
    users
  });

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

  const reacts = await React.find({}).populate({path: 'user upload', populate: {path: 'uploader'}});

  console.log(reacts);

  return res.render('admin/reacts', {
    title : 'Admin Reacts',
    reacts
  });

};
