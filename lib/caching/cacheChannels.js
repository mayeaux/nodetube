const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const View = require('../../models/index').View;


const mongooseHelper = require('./mongooseHelpers');

const clone = require('clone');

const c = {
  l : console.log
};

const redisClient = require('../../config/redis');

const uploadServer = process.env.UPLOAD_SERVER;

let channels;
async function setChannels(){

  const oct1 =  new Date('2017-10-01 21:21:41.230Z');

  const nov1 =  new Date('2017-11-01 21:21:41.230Z');

  const dec1 =  new Date('2017-12-01 21:21:41.230Z');

  const jan1 =  new Date('2018-01-01 21:21:41.230Z');

  const feb1 =  new Date('2018-02-01 21:21:41.230Z');

  let allChannels = [];

  let beforeOctober1 = await User.find({
    status: { $ne: 'restricted' },
    'uploads.1': { $exists: true },
    createdAt: { $lte : oct1 }
  }).populate({path: 'uploads', populate: {path: 'checkedViews'}});

  console.log('got all uploads prior to october');

  let octoberToNovember = await User.find({
    status: { $ne: 'restricted' },
    'uploads.1': { $exists: true },
    createdAt : { $lt: nov1, $gte : oct1  }
  }).populate({path: 'uploads', populate: {path: 'checkedViews'}});

  console.log('got all uploads from october to november');

  let novemberToDecember = await User.find({
    status: { $ne: 'restricted' },
    'uploads.1': { $exists: true },
    createdAt : { $lt: dec1, $gte : nov1  }
  }).populate({path: 'uploads', populate: {path: 'checkedViews'}});

  console.log('got all uploads from november to december');

  let decemberToJanuary = await User.find({
    status: { $ne: 'restricted' },
    'uploads.1': { $exists: true },
    createdAt : { $lt: jan1, $gte : dec1  }
  }).populate({path: 'uploads', populate: {path: 'checkedViews'}});

  console.log('got all uploads from december to january');

  let januaryToFebruary = await User.find({
    status: { $ne: 'restricted' },
    'uploads.1': { $exists: true },
    createdAt : { $lt: feb1, $gte : jan1  }
  }).populate({path: 'uploads', populate: {path: 'checkedViews'}});

  console.log('got all uploads from january to february');

  allChannels = allChannels.concat(beforeOctober1, octoberToNovember, novemberToDecember, decemberToJanuary, januaryToFebruary);

  console.log('done concat');

  // add total views to users
  for(user of allChannels){

    let userUploads = [];

    for(upload of user.uploads){
      // populate wasn't working had to do this

      const realViews = _.filter(upload.checkedViews, function(view){
        return view.validity == 'real'
      });

      upload.legitViewAmount = upload.views + realViews.length;

    }


    user.uploads = _.filter(user.uploads, function(upload){
      return upload.visibility == 'public'
    });

    let totalViews = 0 , totalViewsWithin1month = 0, totalViewsWithin1week = 0, totalViewsWithin24hour = 0;

    for(upload of user.uploads){
      totalViews = totalViews + upload.legitViewAmount;
      totalViewsWithin1month = totalViewsWithin1month +  upload.viewsWithin1month;
      totalViewsWithin1week = totalViewsWithin1week +  upload.viewsWithin1week;
      totalViewsWithin24hour = totalViewsWithin24hour +  upload.viewsWithin24hour;
    }

    user.totalViews = totalViews;
    user.totalViewsWithin1month = totalViewsWithin1month;
    user.totalViewsWithin1week = totalViewsWithin1week;
    user.totalViewsWithin24hour = totalViewsWithin24hour;
  }


  // organize by total views
  allChannels = allChannels.sort(function(a, b) {
    return b.totalViews - a.totalViews;
  });

  return allChannels
}

// TODO: Could use a touchup to pick thumbnail of most popular video
function determineChannelThumbnail(channel){
  let thumbnailUrl;
  const uploadDirectory = `${uploadServer}/${channel.channelUrl}/`;

  if(channel.thumbnailUrl) {
    thumbnailUrl = `${uploadServer}/${channel._id}/unique.png`;
  } else if (channel.uploads.length == 0){
    thumbnailUrl = '/no_img.png'
  } else if (channel.uploads[0].fileType == 'video') {

    const upload = channel.uploads[0];

    if(upload.thumbnails){
      if(upload.thumbnails.custom){
        return uploadDirectory + upload.thumbnails.custom
      } else if(upload.thumbnails.generated){
        return uploadDirectory + upload.thumbnails.generated
      } else if (upload.thumbnails.medium){
        return uploadDirectory + upload.thumbnails.medium
      } else if (upload.thumbnails.large){
        return uploadDirectory + upload.thumbnails.large
      } else {
        return '/no_img.png'
      }
    }

  } else if(channel.uploads[0].fileType == 'audio'){
    thumbnailUrl = '/images/audio.svg'
  } else if (channel.uploads[0].fileType == 'image'){
    thumbnailUrl = uploadDirectory + channel.uploads[0].uniqueTag + channel.uploads[0].fileExtension;
  } else if(channel.uploads[0].fileType == 'unknown'){
    thumbnailUrl = '/images/no_img.png'
  }

  return thumbnailUrl
}

let globalChannels;
async function main() {
  console.log('Caching channels');

  globalChannels  = await setChannels();

  let newChannels = [];

  for(channel of globalChannels){

    channel = {
      channelName : channel.channelName,
      channelUrl: channel.channelUrl,
      uploadAmount: channel.uploads.length,
      totalViews: channel.totalViews,
      totalViewsWithin1month: channel.totalViewsWithin1month,
      totalViewsWithin1week: channel.totalViewsWithin1week,
      totalViewsWithin24hour: channel.totalViewsWithin24hour,
      verified: channel.verified,
      thumbnail: determineChannelThumbnail(channel),
      plan: channel.plan
    };

    newChannels.push(channel)
  }

  const response = await redisClient.setAsync('channels', JSON.stringify(newChannels));

  console.log(response);

  newChannels = [];

  c.l('set channels');
}

module.exports = main;
