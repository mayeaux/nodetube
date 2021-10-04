const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logCaching = process.env.LOG_CACHING;
const jsHelpers = require('../lib/helpers/js-helpers');

function sleep(ms) {
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

if(process.env.MONGOOSE_DEBUG == 'true' || 1 == 1){
  mongoose.set('debug', true);
}

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

console.log(`CACHING IS RUNNING AGAINST: ${database} \n`);

// function find (name, query, cb) {
//   mongoose.connection.db.collection(name, function (err, collection) {
//     collection.find(query).toArray(cb);
//   });
// }
// setTimeout(function(){
//   find('session', {}, function(result){
//     console.log(result);
//   })
// }, 1000)



mongoose.connection.on('open', function (ref) {
  console.log('Connected to mongo server.');
  //trying to get collection names
  mongoose.connection.db.listCollections().toArray(function (err, names) {


    // console.log(names); // [{ name: 'dbname.myCollection' }]

    mongoose.connection.db.collection('sessions', function (err, collection) {
      console.log(collection)

      collection.deleteMany({ session: { $not: /.*passport.*/i }}, function(err, result){
        console.log(result);
      });
    });

  });
})
