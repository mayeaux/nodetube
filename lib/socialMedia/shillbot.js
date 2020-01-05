var rp = require('request-promise');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const gab = require('./gab');
const twitter = require('./twitter');
// const facebook = require('./facebook');
const facebook = require('./fb');



process.on('unhandledRejection', console.log);

dotenv.load({ path: '../.env.example' });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nov28pewtube';

console.log('Connected to ' + mongoUri);

mongoose.Promise = global.Promise;

mongoose.Promise = global.Promise;
mongoose.connect(mongoUri, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true
});

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

const SocialPost = require('../../models/index').SocialPost;

async function socialPostQueue(){
  const socialPost = await SocialPost.findOne({
    finished: false
  }).populate('upload').sort({ createdAt: 1 });

  // console.log(socialPost);
  // console.log('\n');

  if(!socialPost){
    console.log('No unsent socialPost');
    return
  }

  console.log('Sending off socialPost');

  for(const postData of socialPost.postData){

    // console.log(postData);

    // gab post
    if(postData.network == 'gab'){
      try {
        const response = await gab.gabPost(postData.message);
        console.log(response);
        postData.postedCorrectly = true;
      } catch (err){
        console.log(err);
      }
    } else if (postData.network == 'twitter'){
        try {
          const response = await twitter.twitterPost(postData.message);
          console.log(response);
          postData.postedCorrectly = true;
        } catch (err){
          console.log(err);
        }
    } else if (postData.network == 'facebook'){
      try {
        const response = await facebook.facebookPost(postData.message, socialPost.upload);
        console.log(response);
        postData.postedCorrectly = true;
      } catch (err){
        console.log(err);
      }
    }
  }

  socialPost.finished = true;

  // console.log(socialPost);

  await socialPost.save();
  console.log('Done with socialPost');
}

socialPostQueue();



const shillInterval = process.env.SHILL_INTERVAL || 30;

setInterval(socialPostQueue, 1000 * 60 * shillInterval);
