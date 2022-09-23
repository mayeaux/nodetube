const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logCaching = process.env.LOG_CACHING;
const jsHelpers = require('../lib/helpers/js-helpers');

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** FOR FINDING ERRANT LOGS **/
if(process.env.SHOW_LOG_LOCATION == 'true' || 1 == 2){
  jsHelpers.showLogLocation();
}

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception: ', err);
  console.log(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection: ', err);
  console.log(err.stack);
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.settings' });
dotenv.load({ path: '.env.private' });

const database = process.env.MONGODB_URI || process.env.MONGODB_DOCKER_URI || process.env.MONGO_URI || process.env.MONGOLAB_URI;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;

mongoose.Promise = global.Promise;
mongoose.connect(database, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

if(process.env.MONGOOSE_DEBUG == 'true' || process.env.MONGOOSE_DEBUG == 'on'){
  mongoose.set('debug', true);
}

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

console.log(`CACHING IS RUNNING AGAINST: ${database} \n`);

const setCache = require('./setCache'); // index and daily stats

// functions to run caching jobs
const cacheRecentUploads = require('./cacheRecentUploads'); // index and daily stats
const cachePopularUploads = require('./cachePopularUploads'); // index and daily stats
const calculateUploadViews = require('./calculateUploadViews'); // index and daily stats

async function cacheOnlyRecentUploads(){

  try {

    await cacheRecentUploads();

  } catch(err){
    console.log(err);
  }

}

async function cachePopularDailyStatsAndIndex(){
  try {
    await cachePopularUploads();
    await calculateUploadViews();
    await setCache.setDailyStats();
    await setCache.setIndexValues();

    // await cacheChannels();
  } catch(err){
    console.log(err);
  }
}

// parse int because it's a string comming from dotenv
let cacheRecentIntervalInMinutes = parseInt(process.env.CACHE_RECENT_INTERVAL_IN_MINUTES) || 2.5;

const cacheRecentIntervalInMs = cacheRecentIntervalInMinutes * ( 1000 * 60 );

console.log(`CACHE RECENT INTERVAL IN MINUTES: ${cacheRecentIntervalInMinutes}`);

let cacheIntervalInMinutes = parseInt(process.env.CACHE_INTERVAL_IN_MINUTES) || 5;

const cacheIntervalInMs = cacheIntervalInMinutes * ( 1000 * 60 );

console.log(`CACHE POPULAR, DAILY STATS AND INDEXES INTERVAL IN MINUTES: ${cacheIntervalInMinutes} \n`);

let cacheTotalViewsInterval = parseInt(process.env.CACHE_TOTAL_VIEW_INTERVAL) || 6;

const cacheTotalViewsIntervalInMs = cacheTotalViewsInterval * ( 1000 * 60 );

console.log(`CACHE TOTAL VIEW INTERVAL IN MINUTES: ${cacheIntervalInMinutes} \n`);

// TODO: there is a bug here, where when times line up, they will run multiple jobs at once,
// TODO: ideally, they should push into an array, run the most recent job in array, then delete it from array,
// TODO: and run them sequentially

async function runRecentInterval(){
  // calculate and cache recent uploads every minute
  await cacheOnlyRecentUploads();
  await sleep(cacheRecentIntervalInMs);
  runRecentInterval();
}

runRecentInterval();

async function runOtherCaching(){
  await cachePopularDailyStatsAndIndex();
  await sleep(cacheIntervalInMs);
  runOtherCaching();
}

runOtherCaching();

// async function main(){
//
//   // setInterval(cacheOnlyRecentUploads, cacheRecentIntervalInMs);
//   //
//   // setInterval(cachePopularDailyStatsAndIndex, cacheIntervalInMs);
//   //
//   // // calculate total amount of views for channel display
//   // // TODO: couldn't this just be done during popular? maybe not because it doesn't do for sensitive?
//   // // TODO: then just do a separate job for
//   // setInterval(calculateUploadViews, cacheTotalViewsIntervalInMs);
//
//   // calculate and cache recent uploads every minute
//   // await cacheOnlyRecentUploads();
//
//   // also does total view amounts
//   await cachePopularDailyStatsAndIndex();
// }

// main();

// calculateUploadViews()

// setInterval(async function(){
//   await cacheRecentUploads();
// }, 1000 * 30);
