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

const database = process.env.MONGODB_URI || process.env.MONGODB_DOCKER_URI || process.env.MONGO_URI || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/april15pewtube';

console.log(database);

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

console.log('Connected to ' + database);

const setCache = require('./setCache'); // index and daily stats

const cacheRecentUploads = require('./cacheRecentUploads'); // index and daily stats
const cachePopularUploads = require('./cachePopularUploads'); // index and daily stats

// const cacheRecentUploads = require('./cacheRecentAndPopularUploads');

async function main(){

  try {

    await cacheRecentUploads();

  } catch(err){
    console.log(err);
  }

}
// cache recent uploads every minute
main();
setInterval(main, 1000 * 60 * 1);

let cacheIntervalInMinutes = parseInt(process.env.CACHE_INTERVAL_IN_MINUTES) || 5;

const cacheIntervalInMs = cacheIntervalInMinutes * ( 1000 * 60 );

if(logCaching == 'true'){
  console.log(cacheIntervalInMinutes  + ': cache interval in minutes');
}

async function runCaching(){
  try {
    await cachePopularUploads();
    await setCache.setDailyStats();
    await setCache.setIndexValues();

    // await cacheChannels();
  } catch(err){
    console.log(err);
  }
}

runCaching();

setInterval(runCaching, cacheIntervalInMs);

// setInterval(async function(){
//   await cacheRecentUploads();
// }, 1000 * 30);