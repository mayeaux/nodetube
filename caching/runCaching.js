const mongoose = require('mongoose');
const dotenv = require('dotenv');

const logCaching = process.env.LOG_CACHING;

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

const cacheRecentUploads = require('./cacheRecentUploads'); // index and daily stats
const cachePopularUploads = require('./cachePopularUploads'); // index and daily stats

const calculateUploadViews = require('./calculateUploadViews'); // index and daily stats

// const cacheRecentUploads = require('./cacheRecentAndPopularUploads');

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

async function main(){

  setInterval(cacheOnlyRecentUploads, cacheRecentIntervalInMs);

  setInterval(cachePopularDailyStatsAndIndex, cacheIntervalInMs);

  setInterval(calculateUploadViews, cacheIntervalInMs);

  // calculate and cache recent uploads every minute
  await cacheOnlyRecentUploads();

  await cachePopularDailyStatsAndIndex();

  await calculateUploadViews();

}

main();

// calculateUploadViews()

// setInterval(async function(){
//   await cacheRecentUploads();
// }, 1000 * 30);
