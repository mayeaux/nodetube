const pagination = require('../../lib/helpers/pagination');
const _ = require('lodash');
const getFromCache = require('../../caching/getFromCache');
const User = require('../../models/index').User;

exports.channelsByReacts = async(req, res) => {
  // setup page
  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const startingNumber = pagination.getMiddleNumber(page);
  const numbersArray = pagination.createArray(startingNumber);
  const previousNumber = pagination.getPreviousNumber(page);
  const nextNumber = pagination.getNextNumber(page);

  // get and render
  try {

    let allChannels = await User.find({
      status: { $ne: 'restricted' }
    }).populate('subscribers uploads').lean().exec();

    for(let channel of allChannels){

      let reactAmount = 0;

      for(let upload in channel.uploads){
        if(upload.reacts){
          if(upload.reacts.length > 0){
            let amountOfReacts = upload.reacts.length;
            reactAmount = reactAmount + amountOfReacts;
          }
        }
      }

      channel.reactAmount = reactAmount || 0;
    }

    for(channel of allChannels){
      console.log(channel.reactAmount);
    }

    allChannels = _.filter(allChannels, function(channel){
      return channel.reactAmount.length > 0;
    });

    allChannels = allChannels.sort(function(a, b){
      return b.reactAmount.length - a.reactAmount.length;
    });

    console.log(allChannels);

    res.render('public/channelsByReacts', {
      channels : allChannels,
      title: 'Channels',
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber
    });

  } catch(err){
    console.log(err);

    res.status(500);
    return res.render('error/500', {
      title: 'Server Error'
    });
  }
};

exports.channelsBySubs = async(req, res) => {
  // setup page
  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const startingNumber = pagination.getMiddleNumber(page);
  const numbersArray = pagination.createArray(startingNumber);
  const previousNumber = pagination.getPreviousNumber(page);
  const nextNumber = pagination.getNextNumber(page);

  // get and render
  try {

    let allChannels = await User.find({
      status: { $ne: 'restricted' },
      'receivedSubscriptions.0': { $exists: true }
    });

    allChannels = allChannels.sort(function(a, b){
      return b.receivedSubscriptions.length - a.receivedSubscriptions.length;
    });

    res.render('public/channelsBySubs', {
      channels : allChannels,
      title: 'Channels',
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber
    });

  } catch(err){
    console.log(err);

    res.status(500);
    return res.render('error/500', {
      title: 'Server Error'
    });
  }
};

/**
 * GET /channelsBySubs
 * Channels page with ability to sort by views via query params
 */
exports.channels = async(req, res) => {

  // console.log(req.query);

  // setup page
  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  const limit = 51;
  const skipAmount = (page * limit) - limit;

  const startingNumber = pagination.getMiddleNumber(page);
  const numbersArray = pagination.createArray(startingNumber);
  const previousNumber = pagination.getPreviousNumber(page);
  const nextNumber = pagination.getNextNumber(page);

  const withinString = pagination.createWithinString(req.query.within);
  const englishString = pagination.createEnglishString(req.query.within);

  // console.log(withinString, englishString);

  // get and render
  try {

    let channels = await getFromCache.getChannels(req.query.within, limit, skipAmount);

    // let uploads = await getUploads.getUploads(req.query.within, limit, skipAmount);

    res.render('public/channels', {
      withinQuery: req.query.within,
      withinString,
      englishString,
      channels,
      title: 'Channels',
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber
    });

  } catch(err){
    console.log(err);

    res.status(500);
    return res.render('error/500', {
      title: 'Server Error'
    });
  }
};
