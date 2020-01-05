var rp = require('request-promise');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const gab = require('../../lib/socialMedia/gab');
const twitter = require('../../lib/socialMedia/twitter');
// const facebook = require('./facebook');
const facebook = require('../../lib/socialMedia/facebook');

process.on('unhandledRejection', console.log);

dotenv.load({ path: '../.env.private' });
dotenv.load({ path: '../.env.settings' });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

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

const SocialPost = require('../../models').SocialPost;

async function socialPostQueue(){
  const socialPost = await SocialPost.findOne({
    finished: false
  }).populate('upload').sort({ createdAt: 1 });

  // console.log(socialPost);
  // console.log('\n');

  if(!socialPost){
    console.log('No unsent socialPost');
    return;
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
      } catch(err){
        console.log(err);
      }
    } else if(postData.network == 'twitter'){
      try {
        const response = await twitter.twitterPost(postData.message);
        console.log(response);
        postData.postedCorrectly = true;
      } catch(err){
        console.log(err);
      }
    } else if(postData.network == 'facebook'){
      try {
        const response = await facebook.facebookPost(postData.message, socialPost.upload);
        console.log(response);
        postData.postedCorrectly = true;
      } catch(err){
        console.log(err);
      }
    }
  }

  socialPost.finished = true;

  // console.log(socialPost);

  await socialPost.save();
  console.log('Done with socialPost');
}

if(process.env.SHILLBOT_ON == 'true'){
  socialPostQueue();
  const shillInterval = process.env.SHILL_INTERVAL || 30;

  setInterval(socialPostQueue, 1000 * 60 * shillInterval);
} else {
  console.log('Shillbot not turned on');
}

