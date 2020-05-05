const Upload = require('../models/index').Upload;
const View = require('../models/index').View;
const User = require('../models/index').User;
const Subscription = require('../models/index').Subscription;
const React = require('../models/index').React;
const Comment = require('../models/index').Comment;
const SiteVisit = require('../models/index').SiteVisit;
const SearchQuery = require('../models/index').SearchQuery;

const moment = require('moment');

const redisClient = require('../config/redis');

const logCaching = process.env.LOG_CACHING;

let viewAmount, channelAmount, mediaAmount;
async function setIndexValues(){

  if(logCaching == 'true'){
    console.log('Setting index values');

    console.log('Calculating view amounts');
  }

  // view amount is for the old view amount

  // TODO: have to implement this as real: true only when validation is done
  viewAmount = await  View.estimatedDocumentCount({});

  if(logCaching == 'true'){
    console.log('View amount calculated, calculating channel amount');
  }

  channelAmount = await User.estimatedDocumentCount({});

  if(logCaching == 'true'){
    console.log('Channel amount calculated, calculating upload amount');
  }

  mediaAmount = await Upload.estimatedDocumentCount({});

  if(logCaching == 'true'){
    console.log('Upload amount calculated, calculating view amount');
  }

  // set object properly
  redisClient.hmset('indexValues', {
    viewAmount,
    channelAmount,
    mediaAmount
  });

  if(logCaching == 'true'){
    console.log('Set index values');
  }

}

// setTimeout(setIndexValues, 1000 * 60 * 2);
//
// setInterval(function(){
//   setIndexValues()
// }, 1000 * 60 * 20);

/** THIS IS FOR DAILY STATS, VIEWS ALSO USED IN POPULAR **/

// TODO: refactor to do via count
async function getAmountsPerPeriods(Model, objectName){

  const totalDocumentAmount = await Model.estimatedDocumentCount({});

  if(logCaching == 'true'){
    console.log(`Got total ${objectName} counted`);
  }

  // build dates
  var monthAgo =  moment().subtract(30, 'days').toDate();
  var weekAgo =  moment().subtract(7, 'days').toDate();
  var dayAgo = moment().subtract(24, 'hours').toDate();
  var hourAgo = moment().subtract(1, 'hours').toDate();
  var minuteAgo = moment().subtract(1, 'minutes').toDate();

  // find the views
  const lastMonthAmount= await Model.countDocuments({ createdAt: { $gte: monthAgo } });
  const lastWeekAmount = await Model.countDocuments({ createdAt: { $gte: weekAgo } });
  const lastDayAmount = await Model.countDocuments({ createdAt: { $gte: dayAgo } });
  const lastHourAmount = await Model.countDocuments({ createdAt: { $gte: hourAgo } });
  const lastMinuteAmount = await Model.countDocuments({ createdAt: { $gte: minuteAgo } });

  return{
    name: objectName,
    alltime: totalDocumentAmount,
    month: lastMonthAmount,
    week: lastWeekAmount,
    day: lastDayAmount,
    hour: lastHourAmount,
    minute: lastMinuteAmount
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
  if(logCaching == 'true'){
    console.log('Setting daily stats');

    console.log('Getting uploads');
  }

  const uploads = await getAmountsPerPeriods(Upload, 'uploads');
  await redisClient.setAsync('dailyStatsUploads', JSON.stringify(uploads));

  if(logCaching == 'true'){
    console.log('Uploads set, moving on');

    console.log('Getting users');
  }

  const users = await getAmountsPerPeriods(User, 'users');
  await redisClient.setAsync('dailyStatsUsers', JSON.stringify(users));

  if(logCaching == 'true'){
    console.log('Users set, moving on');

    console.log('Getting subscriptions');
  }

  const subscriptions = await getAmountsPerPeriods(Subscription, 'subscriptions');
  await redisClient.setAsync('dailyStatsSubscriptions', JSON.stringify(subscriptions));

  if(logCaching == 'true'){
    console.log('Subscriptions set, moving on');

    console.log('Getting reacts');
  }

  const reacts = await getAmountsPerPeriods(React, 'reacts');
  await redisClient.setAsync('dailyStatsReacts', JSON.stringify(reacts));

  if(logCaching == 'true'){
    console.log('Reacts set, moving on');

    console.log('Getting searches');
  }

  const searches = await getAmountsPerPeriods(SearchQuery, 'searches');
  await redisClient.setAsync('dailyStatsSearches', JSON.stringify(searches));

  if(logCaching == 'true'){
    console.log('Searches set, moving on');

    console.log('Getting comments');
  }

  const comments = await getAmountsPerPeriods(Comment, 'comments');
  await redisClient.setAsync('dailyStatsComments', JSON.stringify(comments));

  if(logCaching == 'true'){
    console.log('Comments set, moving on');

    console.log('Getting views');
  }

  const views = await getAmountsPerPeriods(View, 'views');

  await redisClient.setAsync('dailyStatsViews', JSON.stringify(views));

  if(logCaching == 'true'){
    console.log('Views set, moving on');

    console.log('Getting siteVisits');
  }

  const siteVisits = await getAmountsPerPeriods(SiteVisit, 'siteVisits');
  await redisClient.setAsync('dailyStatsSiteVisits', JSON.stringify(siteVisits));

  if(logCaching == 'true'){
    console.log('SiteVisit set, moving on');

    console.log('Set daily stats');
  }

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
