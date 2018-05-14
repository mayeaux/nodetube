const Promise = require('bluebird');
const _ = require('lodash');
const User = require('../models/index').User;
const View = require('../models/index').View;

const Upload = require('../models/index').Upload;

const clone = require('clone');
const sizeof = require('object-sizeof');
const moment = require('moment');

const c = {
  l : console.log
};

const redisClient = require('../config/redis');

// build dates
var monthAgo =  moment().subtract(30, 'days').toDate();
var weekAgo =  moment().subtract(7, 'days').toDate();
var dayAgo = moment().subtract(24, 'hours').toDate();
var hourAgo = moment().subtract(1, 'hours').toDate();
var minuteAgo = moment().subtract(1, 'minutes').toDate();

// find the views

async function setTimedUploads(){

  console.log('Getting all uploads');

  let allUploads = await Upload.find({
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne : true },
    uploader: { $exists: true }
  }).select('rating title views checkedViews uploader fileType thumbnailUrl uploadUrl uniqueTag customThumbnailUrl fileExtension thumbnails reacts uncurated')
    .populate('uploader reacts').limit(250).lean();

  console.log('Got all uploads');

  let uploadsWithViews = [];

  for(const upload of allUploads){

    console.log(upload.uploader.channelUrl);

    upload.viewsWithin1hour = await View.count({ upload, validity: 'real', createdAt: { $gte: hourAgo } });
    upload.viewsWithin24hour = await View.count({ upload, validity: 'real', createdAt: { $gte: dayAgo } });
    upload.viewsWithin1week = await View.count({ upload, validity: 'real', createdAt: { $gte: weekAgo } });
    upload.viewsWithin1month = await View.count({ upload, validity: 'real', createdAt: { $gte: monthAgo } });
    upload.viewsAllTime = await View.count({ upload, validity: 'real' });

    // TODO: this is used to cap at 3000
    // upload.legitViewAmount = (await View.count({ upload, validity: 'real', createdAt: { $gte: hourAgo } })) + upload.views.length ;
    uploadsWithViews.push(upload);
  }

  uploadsWithViews =  _.filter(uploadsWithViews, function(upload){

    return upload.uploader;
  });

  c.l(uploadsWithViews.length);

  return uploadsWithViews
}

async function main() {
  console.log('Caching uploads');

  let newUploads = [];

  let globalUploads  = await setTimedUploads();

  for(let upload of globalUploads){
    upload = {
      uploader : {
        channelName: upload.uploader.channelName,
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

      // TODO: no capping currently
      legitViewAmount: upload.viewsAllTime,

      thumbnailUrl: upload.thumbnailUrl,
      customThumbnailUrl: upload.customThumbnailUrl,
      thumbnails: upload.thumbnails,
      rating: upload.rating,
      reacts: upload.reacts

    };
    newUploads.push(upload);
  }

  console.log('done creating new uploads')

  // const scoredUploads = scoreUploads(newUploads);
  //
  // console.log('finished scoring uploads');


  // console.log(scoredUploads);

  const response = await redisClient.setAsync('uploads', JSON.stringify(newUploads));

  console.log(`REDIS RESPONSE: ${response}`);

  console.log('set uploads');
}

module.exports = main;



