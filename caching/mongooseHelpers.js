const mongoose = require('mongoose');
const Upload = require('../models/index.js').Upload;
const View = require('../models/index.js').View;
const _ = require('lodash');

//
// /**
//  * Connect to MongoDB.
//  */
// mongoose.Promise = global.Promise;
//
// mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://localhost:27017/prodpewd', {
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

async function determineLegitViewsForUploads(uploads, timeRange){

  // grab the date object for how long ago a certain time is
  // TODO: Could probably be improved with moment, in meantime cover 1h, 1d, 1w, 1m, (all-time can be run by default)
  let timeAgoDate;
  if(timeRange == '1hour'){ // Hour
    timeAgoDate = new Date() - 1000 * 60 * 60;
    console.log('Hour');
  } else if(timeRange == '12hour'){ // 12 hours
    timeAgoDate = new Date() - 1000 * 60 * 60 * 12;
    console.log('12 Hours');
  } else if(timeRange == '24hour' || timeRange == '1day'){ // Day
    timeAgoDate = new Date() - 1000 * 60 * 60 * 24;
    console.log('Day');
  } else if(timeRange == '1week'){ // Week
    timeAgoDate = new Date() - 1000 * 60 * 60 * 24 * 7;
    console.log('Week');
  } else if(timeRange == '1month'){ // Month
    timeAgoDate = new Date() - 1000 * 60 * 60 * 24 * 30;
    console.log('Month');
  }

  let updatedUploads = [];

  for(let upload of uploads){

    /** CONVERT TO OBJECT FOR MONGOOSE VIRTUALS **/
    upload = upload.toObject();

    // console.log(upload.legitViewAmount)

    // /** CALCULATE HOW MANY LEGIT VIEWS **/
    // let realViewAmount = 0, fakeViewAmount = 0;
    // for(const view of upload.checkedViews){
    //   if(view.validity == 'real') realViewAmount++
    //   if(view.validity == 'fake') fakeViewAmount++
    // }
    // upload.legitViewAmount = upload.views + realViewAmount;

    /** CAP IF OVER 300 IN LESS THAN 24H **/
    const timeDiff = new Date() - upload.createdAt;
    const timeDiffInH = timeDiff / ( 1000 * 60 * 60);
    if(timeDiffInH < 24 && upload.legitViewAmount > 300){
      upload.legitViewAmount = 300;
    }

    updatedUploads.push(upload);
  }

  return updatedUploads;
}

async function test(){
  let uploads = await Upload.find({
    uploadUrl: {$exists: true },
    visibility: 'public'
  }).populate('uploader').sort({ createdAt: -1 });

  uploads = await determineLegitViewsForUploads(uploads);

  // console.log(uploads[1]);
}

// test();

module.exports = {
  determineLegitViewsForUploads
};