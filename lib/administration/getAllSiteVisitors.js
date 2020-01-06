const Promise = require('bluebird');
const mongoose = require('mongoose');
const User = require('../../models/index.js').User;
const SiteVisit = require('../../models/index.js').SiteVisit;
const Upload = require('../../models/index.js').Upload;
const Comment = require('../../models/index.js').Comment;


const request = Promise.promisifyAll(require('request'));
const fs = Promise.promisifyAll(require('fs'));

var ffmpeg = require('fluent-ffmpeg');
const path = require('path');

function remove_duplicates_es6(arr) {
  let s = new Set(arr);
  let it = s.values();
  return Array.from(it);
}


// const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nov28pewtube';
//
// console.log('Connecting to ' + mongoUri);


// /**
//  * Connect to MongoDB.
//  */
// mongoose.Promise = global.Promise;
//
// mongoose.Promise = global.Promise;
// mongoose.connect(mongoUri, {
//   keepAlive: true,
//   reconnectTries: Number.MAX_VALUE,
//   useMongoClient: true
// });
//
// mongoose.connection.on('error', (err) => {
//   console.error(err);
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
//   process.exit();
// });
//
//
// process.on('uncaughtException', (err) => {
//   console.log(`Uncaught Exception: `, err);
//   console.log(err.stack);
// });
//
// process.on('unhandledRejection', (err) => {
//   console.log(`Unhandled Rejection: `, err);
//   console.log(err.stack);
// });


const c = {
  l : console.log
};

const userToDelete = 'testuser';

async function main(){

  let allFoundUsers = [];
  let allSiteVisits = [];

  // find the user
  /** find user **/
  const user = await User.findOne({ channelUrl: userToDelete });

  // console.log(user);

  /** find all sitevisits for user **/
  const sitevisits = await SiteVisit.find({ user: user._id });

  // console.log(sitevisits.length);

  /** loop through all sitevisits of user **/
  for(let sitevisit of sitevisits){
    // console.log(sitevisit.ip);

    /** find all sitevisits for that ip **/



    const newSiteVisits = await SiteVisit.find({ ip : sitevisit.ip });

    for(let newSiteVisit of newSiteVisits){
      allSiteVisits.push(newSiteVisit);
    }

    // console.log(newSiteVisits);
    //
    // console.log(newSiteVisits.length);

    /** find all users for the sitevisits attached to that ip **/
    for(let newsitevisit of newSiteVisits){
      if(newsitevisit.user){
        let newUser = await User.findOne({ _id: newsitevisit.user });

        if(newUser){
          allFoundUsers.push(newUser)
        }

        // console.log(newUser)
      }
      // console.log(newsitevisit.user);
    }


  }

  let foundUserNames = [];
  let foundSiteVisitorIps = [];


  for(let foundUser of allFoundUsers){

    foundUserNames.push(foundUser.channelUrl);
    // console.log(foundUser.channelUrl);
  }

  foundUserNames = remove_duplicates_es6(foundUserNames);

  console.log(foundUserNames);


  // console.log(allSiteVisits);


  for(let foundSiteVisit of allSiteVisits){

    foundSiteVisitorIps.push(foundSiteVisit._id);
  }

  foundSiteVisitorIps = remove_duplicates_es6(foundSiteVisitorIps);

  console.log(foundSiteVisitorIps);

  for(let username of foundUserNames){
    let userToDelete = await User.findOne({ channelUrl: username });
    userToDelete.status = 'restricted';
    await userToDelete.save();

    const uploads = await Upload.find({ uploader: user._id });

    const comments = await Comment.find({ commenter: user._id });


    for(let upload of uploads){
      upload.visibility = 'removed';
      await upload.save();
    }

    for(let comment of comments){
      comment.visibility = 'removed';
      await comment.save();
    }


  }

  for(let id of foundSiteVisitorIps){
    console.log(id);

    let siteVisit = await SiteVisit.findOne({ _id: id });

    console.log(siteVisit);

    siteVisit.blocked = true;
    await siteVisit.save();
  }


}

main();



