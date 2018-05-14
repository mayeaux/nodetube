const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: `, err);
  console.log(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection: `, err);
  console.log(err.stack);
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.settings' });
dotenv.load({ path: '.env.private' });

const database = process.env.MONGODB_DOCKER_URI || process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/april15pewtube';

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

// mongoose.set('debug', true);


mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

console.log('Connected to ' + database);

const cacheChannels = require('./cacheChannels'); // cache channels by popularity every 20 mins
const cacheUploads = require('./cacheUploads');  // cache popular uploads
const setCache = require('./setCache'); // index and daily stats

async function main(){

  try {
    await setCache.setDailyStats();
    await setCache.setIndexValues();

    // TODO: cache uploads and channels correctly crash
    await cacheUploads();
    await cacheChannels();
  } catch (err){
    console.log(err);
  }

}

main();
setInterval(main, 1000 * 60 * 20);
