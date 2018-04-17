const Upload = require('../../models/index').Upload;
const View = require('../../models/index').View;
const User = require('../../models/index').User;
const Subscription = require('../../models/index').Subscription;
const React = require('../../models/index').React;
const Comment = require('../../models/index').Comment;
const SiteVisit = require('../../models/index').SiteVisit;
const SearchQuery = require('../../models/index').SearchQuery;

const _ = require('lodash');

const moment = require('moment');

const redisClient = require('../../config/redis');

let viewAmount, channelAmount, mediaAmount;
async function setIndexValues(){

  console.log('setting index values');

  // view amount is for the old view amount
  viewAmount = await Upload.aggregate([
    { $match:  {visibility: { $ne: 'removed' } }},
    { $group: {
      _id: '',
      views: { $sum: '$views' }
    }
    }]);

  if(!viewAmount[0]){
    viewAmount = 0;
  } else {
    viewAmount = viewAmount[0].views;
  }

  channelAmount = await User.find({}).count();
  mediaAmount = await Upload.find({}).count();

  const legitCheckedViews = await View.find({ validity: 'real' });

  viewAmount = viewAmount + legitCheckedViews.length;

  // set object properly
  redisClient.hmset('indexValues', {
    viewAmount,
    channelAmount,
    mediaAmount
  });

  console.log('set index values');


}

// setTimeout(setIndexValues, 1000 * 60 * 2);
//
// setInterval(function(){
//   setIndexValues()
// }, 1000 * 60 * 20);



async function getAmountsPerPeriods(Model, objectName){


  const documents = await Model.find({}).select('createdAt');

  // build dates
  var monthAgo =  moment().subtract(30, 'days').toDate();
  var weekAgo =  moment().subtract(7, 'days').toDate();
  var dayAgo = moment().subtract(24, 'hours').toDate();
  var hourAgo = moment().subtract(1, 'hours').toDate();
  var minuteAgo = moment().subtract(1, 'minutes').toDate();

  // find the views
  const lastMonthAmount = _.filter(documents, function(document){ return document.createdAt > monthAgo });
  const lastWeekAmount = _.filter(documents, function(document){ return document.createdAt > weekAgo });
  const lastDayAmount = _.filter(documents, function(document){ return document.createdAt > dayAgo });
  const lastHourAmount = _.filter(documents, function(document){ return document.createdAt > hourAgo });
  const lastMinuteAmount = _.filter(documents, function(document){ return document.createdAt > minuteAgo });

  return  {
    name: objectName,
    alltime: documents.length,
    month: lastMonthAmount.length,
    week: lastWeekAmount.length,
    day: lastDayAmount.length,
    hour: lastHourAmount.length,
    minute: lastMinuteAmount.length
  };
}


// async function testThing(){
//   const uploads = await Upload.find({}).select('createdAt');
//   var monthAgo =  moment().subtract(30, 'days').toDate();
//   var weekAgo =  moment().subtract(7, 'days').toDate();
//   var dayAgo = moment().subtract(24, 'hours').toDate();
//   var hourAgo = moment().subtract(1, 'hours').toDate();
//   var minuteAgo = moment().subtract(1, 'minutes').toDate();
//
//   const lastMonthUploads = _.filter(uploads, function(upload){
//     return upload.createdAt > monthAgo
//   })
//
//   console.log(lastMonthUploads.length);
//
//
// }
//
// testThing();

async function setDailyStats(){
  console.log('Setting daily stats');

  /** SET ALLTIME VIEWS PROPERLY **/
  const allUploads = await Upload.find({ visibility: 'public' });

  let oldViewAmount = 0;
  for(const upload of allUploads){
    oldViewAmount = oldViewAmount + upload.views
  }

  const uploads = await getAmountsPerPeriods(Upload, 'uploads');
  const users = await getAmountsPerPeriods(User, 'users');
  const subscriptions = await getAmountsPerPeriods(Subscription, 'subscriptions');
  const reacts = await getAmountsPerPeriods(React, 'reacts');
  const searches = await getAmountsPerPeriods(SearchQuery, 'searches');
  const comments = await getAmountsPerPeriods(Comment, 'comments');
  const siteVisits = await getAmountsPerPeriods(SiteVisit, 'siteVisits');
  const views = await getAmountsPerPeriods(View, 'views');
  views.alltime = views.alltime + oldViewAmount;


  await redisClient.setAsync('dailyStatsReacts', JSON.stringify(reacts));
  await redisClient.setAsync('dailyStatsSubscriptions', JSON.stringify(subscriptions));
  await redisClient.setAsync('dailyStatsViews', JSON.stringify(views));
  await redisClient.setAsync('dailyStatsUploads', JSON.stringify(uploads));
  await redisClient.setAsync('dailyStatsUsers', JSON.stringify(users));
  await redisClient.setAsync('dailyStatsSearches', JSON.stringify(searches));
  await redisClient.setAsync('dailyStatsSiteVisits', JSON.stringify(siteVisits));
  await redisClient.setAsync('dailyStatsComments', JSON.stringify(comments));


  console.log('set daily stats')


}

module.exports = {
  setDailyStats,
  setIndexValues
};


// setDailyStats();
// setInterval(function(){
//   setDailyStats();
// }, 1000 * 60 * 30);
//
