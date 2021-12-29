const Upload = require('../models/index').Upload;
const View = require('../models/index').View;
const moment = require('moment');

const c = {
  l : console.log
};

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

    upload.views = amountOfViews;

    await upload.save();
  }

  if(logCaching == 'true'){
    c.l('View amounts calculated');
    console.log(moment(new Date).format('hh:mm:ss A'));
  }
}

module.exports = calculateViewAmounts;

