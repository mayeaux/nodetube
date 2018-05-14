const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const Upload = require('../models/index').Upload;

const clone = require('clone');
const sizeof = require('object-sizeof');
const moment = require('moment');

const c = {
  l : console.log
};

const redisClient = require('../config/redis');

async function setTimedUploads(){

  const oct1 =  new Date('2017-10-01 21:21:41.230Z');

  const nov1 =  new Date('2017-11-01 21:21:41.230Z');

  const dec1 =  new Date('2017-12-01 21:21:41.230Z');

  const jan1 =  new Date('2018-01-01 21:21:41.230Z');

  const feb1 =  new Date('2018-02-01 21:21:41.230Z');

  let allUploads = [];

  let beforeOctober1 = await Upload.find({
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    createdAt: { $lte : oct1 }
  }).select('rating title views checkedViews uploader fileType thumbnailUrl uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated')
    .populate('checkedViews uploader reacts');

  console.log('got all uploads prior to october');

  let octoberToNovember = await Upload.find({
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    createdAt : { $lt: nov1, $gte : oct1  }
  }).select('rating title views checkedViews uploader fileType thumbnailUrl uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated').populate('checkedViews uploader reacts');

  console.log('got oct to nov');

  let novemberToDecember = await Upload.find({
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    createdAt : { $lt: dec1, $gte : nov1  }
  }).select('rating title views checkedViews uploader fileType thumbnailUrl uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated').populate('checkedViews uploader reacts');

  console.log('got nov to dec');

  let decemberToJanuary = await Upload.find({
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    createdAt : { $lt: jan1, $gte : dec1  }
  }).select('rating title views checkedViews uploader fileType thumbnailUrl uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated').populate('checkedViews uploader reacts');

  console.log('got dec to jan');

  let januaryToFebruary = await Upload.find({
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    createdAt : { $lt: feb1, $gte : jan1  }
  }).select('rating title views checkedViews uploader fileType thumbnailUrl uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated').populate('checkedViews uploader reacts');

  console.log('got jan to feb');

  allUploads = allUploads.concat(beforeOctober1, octoberToNovember, novemberToDecember, decemberToJanuary, januaryToFebruary);

  console.log('done concat');

  allUploads = allUploads.map(function(upload){
    // console.log(upload.reacts);

    return upload.toObject();
  });

  console.log('converted to object');

  allUploads =  _.filter(allUploads, function(upload){
    return upload.uploader && upload.uploader.curated && ( upload.uncurated !== true );
  });

  console.log('filter out those without uploader');

  c.l(allUploads.length);

  return allUploads
}


function scoreReacts(upload){
  let totalScore = 0;

  if(!upload.reacts){
    return totalScore;
  }

  for(const react of upload.reacts){

    const didOwnReact = react.user.toString() == upload.uploader._id.toString();

    if( (react.react == 'like' || react.react == 'laugh' || react.react == 'love') && !didOwnReact ){
      totalScore = totalScore + 1
    } else if ( react.react == 'dislike' && !didOwnReact){
      totalScore = totalScore + 0.5;
    } else if( (react.react == 'sad' || react.react == 'disgust') && !didOwnReact){
      totalScore = totalScore + 0.1
    }
  }

  return totalScore;
}



async function scoreFreshness(upload){

  var now = moment(new Date()); //todays date
  var end = moment("2015-12-1"); // another date
  var duration = moment.duration(now.diff(end));
  var hours = duration.Hours();
  console.log(hours);



  const oneDayAgoHours = 24;
  const oneWeekAgoHours = 24 * 7;
  const oneMonthAgoHours = 24 * 7 * 30;
  const allTime = 24 * 7 * 365;

  // figure out how many old, figure out the percentages that way based on hours
  // aka, one hour away from turning 24 scores a 23/24, aka 1/24, aka 4.16%
}

function calculateMultiplier(upload){
  const reactScore = scoreReacts(upload);
  // console.log(`react score: ${reactScore}`);

  if(reactScore == 0){
    return 0.1
  }
  const allTimeViews = upload.viewsAllTime;

  // how many views to get a positive feeling?


  const viewToReactRatio = allTimeViews / reactScore;

  // 150 as a baseline
  // if you score below 150, you are doing pretty hot
  // if you score above

  const baseline = Number(process.env.BASELINE) || 150;

  const multiplier = baseline / viewToReactRatio;

  return multiplier

}

function scoreUpload(upload){

  const multiplier = calculateMultiplier(upload);
  // console.log(`multiplier: ${multiplier}`);


  // TODO: add freshness
  // const freshness = scoreFreshness

  upload.trendingScores = {};

  // console.log(upload.viewsAllTime);
  // console.log(multiplier);

  upload.trendingScores['24hour'] = upload.viewsWithin24hour * multiplier;
  upload.trendingScores['1week'] = upload.viewsWithin1week * multiplier;
  upload.trendingScores['1month'] = upload.viewsWithin1month * multiplier;
  upload.trendingScores['allTime'] = upload.viewsAllTime * multiplier;

  // console.log(upload.trendingScores);

  return upload;

};


function scoreUploads(uploads){

  let scoredUploads = [];

  for(let upload of uploads){

    // console.log('scoring upload');

    upload = scoreUpload(upload);

    // console.log('scored upload')
    // console.log(upload);


    scoredUploads.push(upload);
  }

  return scoredUploads

}



async function main() {
  console.log('Caching uploads');

  let newUploads = [];

  let globalUploads  = await setTimedUploads();

  for(let upload of globalUploads){
    upload = {
      uploader : {
        channelName : upload.uploader.channelName,
        channelUrl: upload.uploader.channelUrl,
        verified: upload.uploader.verified,
        plan: upload.uploader.plan,
        _id: upload.uploader._id,
        curated: upload.uploader.curated
      },
      _id: upload._id,
      title: upload.title,
      fileType: upload.fileType,
      fileExtension: upload.fileExtension,
      uniqueTag: upload.uniqueTag,
      uploadUrl: upload.uploadUrl,
      timeAgo: upload.timeAgo,
      viewsWithin1hour: upload.viewsWithin1hour,
      viewsWithin24hour: upload.viewsWithin24hour,
      viewsWithin1week: upload.viewsWithin1week,
      viewsWithin1month: upload.viewsWithin1month,
      viewsAllTime: upload.viewsAllTime,
      legitViewAmount: upload.legitViewAmount,
      thumbnailUrl: upload.thumbnailUrl,
      customThumbnailUrl: upload.customThumbnailUrl,
      thumbnails: upload.thumbnails,
      rating: upload.rating,
      reacts: upload.reacts

    };
    newUploads.push(upload);
  }

  console.log('done creating new uploads')

  const scoredUploads = scoreUploads(newUploads);

  console.log('finished scoring uploads');


  // console.log(scoredUploads);

  const response = await redisClient.setAsync('uploads', JSON.stringify(scoredUploads));

  console.log(`REDIS RESPONSE: ${response}`);

  console.log('set uploads');
}

module.exports = main;



