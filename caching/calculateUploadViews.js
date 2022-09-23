const Promise = require('bluebird');
const _ = require('lodash');
const View = require('../models/index').View;
const Upload = require('../models/index').Upload;
const moment = require('moment');

const c = {
  l : console.log
};

const redisClient = require('../config/redis');

const helpers = require('../caching/helpers');

const calculateViewsByPeriod = helpers.calculateViewsByPeriod;

const buildObjects = helpers.buildObjects;

// find the views

const logCaching = process.env.LOG_CACHING;

async function calculateViewAmounts(){

  if(logCaching == 'true'){
    c.l('Calculating view amounts for particular videos');
    console.log(moment(new Date).format('hh:mm:ss A'));
  }

  // TODO: have to have a job to update upload's view amounts

  // TODO: have to build 4 arrays of ~1000

  const searchQuery = {
    status: 'completed'
  };

  const selectString = 'views';

  let uploads = await Upload.find(searchQuery).select(selectString);

  for(const upload of uploads){
    const amountOfViews = await View.countDocuments({ upload: upload.id, validity: 'real' });

    // console.log(upload.views);

    upload.views = amountOfViews;

    await upload.save();
  }

  if(logCaching == 'true'){
    c.l('View amounts calculated');
    console.log(moment(new Date).format('hh:mm:ss A'));
  }

  // if(logCaching == 'true'){
  //   c.l('Uploads received from database');
  //
  //   c.l(popularUploads.length);
  // }

  // return uploads;
}

// calculateViewAmounts();

module.exports = calculateViewAmounts;

