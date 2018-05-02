const _ = require('lodash');

const redisClient = require('../../config/redis');

const pagination = require('../../lib/helpers/pagination');

const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const SearchQuery = require('../../models/index').SearchQuery;
const View = require('../../models/index').View;


const uploadHelpers = require('../../lib/helpers/settings');

const uploadServer = uploadHelpers.uploadServer;

const getFromCache = require('../../lib/caching/getFromCache');

const { getFilter, filterUploads } = require('../../lib/mediaBrowsing/helpers');

// TODO: pull into its own func
let indexResponse;
async function setIndex(){
  indexResponse = await redisClient.hgetallAsync('indexValues');
  console.log('got index cache');
}

setIndex();
setInterval(function(){
  setIndex()
}, 1000 * 60 * 2);



console.log('UPLOAD SERVER: ' + uploadServer);



const mongooseHelpers = require('../../lib/caching/mongooseHelpers');


/**
 * GET /media/recent
 * Page displaying most recently uploaded content
 */
exports.recentUploads = async (req, res) => {
  let media = req.query.media || 'all';

  let page = req.params.page || 1;

  page = parseInt(page);

  // limit amount to list per page
  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  // FILTER UPLOADS
  let searchQuery = {
    $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ],
    visibility: 'public',
    sensitive: { $ne: true }
  };

  // setup query hint based on media type
  let queryHint = "All Media List";
  if(media !== 'all'){
    searchQuery.fileType = media;
    queryHint = "File Type List";
  }

  // get uploads based on skipping based on createdAt time
  let uploads = await Upload.find(searchQuery)
    .populate('uploader')
    .sort({ createdAt: -1 })
    .hint(queryHint)
    .skip((page * limit) - limit)
    .limit(limit);

  // populate upload.legitViewAmount
  uploads = await Promise.all(
    uploads.map(async function(upload){
      upload = upload.toObject();
      const checkedViews = await View.count({ upload: upload.id, validity: 'real' });
      upload.legitViewAmount = checkedViews;
      return upload
    })
  );

  // filter uploads based on sensitivity
  let filter = getFilter(req.user, req.siteVisitor);
  uploads = filterUploads(uploads, filter);

  res.render('public/recentUploads', {
    title: 'Recent Uploads',
    uploads,
    numbersArray,
    highlightedNumber: page,
    previousNumber,
    nextNumber,
    media,
    uploadServer,
    siteVisitor: req.siteVisitor
  });
};


// todo: get out of controller
let viewStats;
async function getStats(){
  let views = await redisClient.getAsync('dailyStatsViews');
  viewStats = JSON.parse(views);

}
getStats();
setInterval(function(){
  getStats()
}, 1000 * 60 * 1);




/**
 * GET /
 * Media page.
 */
exports.popularUploads = async (req, res) => {
  // setup page
  let page = req.params.page;
  if(!page){ page = 1 }
  page = parseInt(page);

  const limit = 102;
  const skipAmount = (page * limit) - limit;

  const startingNumber = pagination.getMiddleNumber(page);
  const numbersArray = pagination.createArray(startingNumber);
  const previousNumber = pagination.getPreviousNumber(page);
  const nextNumber = pagination.getNextNumber(page);


  const withinString = pagination.createWithinString(req.query.within);

  const englishString = pagination.createEnglishString(req.query.within);

  // console.log(englishString)

  //  amount to show in brackets that equals view amount in time period
  let viewAmountInPeriod;

  try {

    switch(englishString){
      case "Last Hour":
        viewAmountInPeriod = viewStats.hour;
        break;
      case "Last Day":
        viewAmountInPeriod = viewStats.day;
        break;
      case "Last Week":
        viewAmountInPeriod = viewStats.week;
        break;
      case "Last Month":
        viewAmountInPeriod = viewStats.month;
        break;
      case "All Time":
        viewAmountInPeriod = indexResponse.viewAmount;
        break;
    }

    // console.log(viewStats);
    // console.log(indexResponse);

    // TODO: add upload.uploadServer
    let uploads = await getFromCache.getUploads(req.query.within, limit, skipAmount);

    let filter;
    if(req.user){
      filter = req.user.filter
    } else {
      filter = req.siteVisitor.filter
    }

    if(filter == 'sensitive'){
      // nothing to do
    } else if (filter == 'mature'){

      // return ones not marked as sensitive
      uploads = _.filter(uploads, function(upload){
        return upload.rating !== 'sensitive'
      });

    } else if (filter == 'allAges'){

      // return ones not marked as sensitive or mature
      uploads = _.filter(uploads, function(upload){
        return upload.rating !== 'sensitive' && upload.rating !== 'mature'
      });

    }

    // const uploadServer = 'https://uploads.pew.tube/uploads';


    const siteVisitor = req.siteVisitor;

    res.render('public/popularUploads', {
      title: 'Popular Uploads',
      uploads,
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber,
      withinString,
      englishString,
      viewAmountInPeriod,
      uploadServer,
      filter,
      siteVisitor
    });

  } catch (err){
    console.log('ERR:')
    console.log(err)

    res.status(500);
    return res.render('error/500', {
      title: 'Server Error'
    });
  }


};




/**
* POST /
* Search page.
*/
exports.results = async (req, res) => {

  // get search term from body
  const search = req.body.search;

  console.log(search);

  if(!req.body.search){
    console.log('doing redirect')

    req.flash('errors', { msg: 'Please enter a search term' });
    return res.redirect('/search')
  }

  // note the person searching
  let searcher = req.user && req.user.id || undefined;

  // create and save search query
  const searchQuery = new SearchQuery({
    searcher: searcher,
    query: search
  });

  await searchQuery.save();

  // create a regexp for mongo
  const re = new RegExp(search, "gi");

  let uploads, users;

  if(req.body.type == 'upload'){

    // uploads
    uploads = await Upload.find({
      visibility: 'public',
      title : re,
      $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ]
    }).populate('uploader checkedViews');



  } else if(req.body.type == 'user'){

    // channels
    users = await User.find({
      $or : [ { channelName: re }, { channelUrl: re  } ],
      status: { $ne: 'restricted'}
    }).populate('uploads');

    users = _.filter(users, function(user){
      return user.uploads.length > 0
    });

  } else {
    // TODO: Throw an error
  }

  let filter;
  if(req.user){
    filter = req.user.filter
  } else {
    filter = req.siteVisitor.filter
  }

  if(filter == 'sensitive'){
    // nothing to do
  } else if (filter == 'mature'){

    // return ones not marked as sensitive
    uploads = _.filter(uploads, function(upload){
      return upload.rating !== 'sensitive'
    });

  } else if (filter == 'allAges'){

    // return ones not marked as sensitive or mature
    uploads = _.filter(uploads, function(upload){
      return upload.rating !== 'sensitive' && upload.rating !== 'mature'
    });

  }

  const siteVisitor = req.siteVisitor;

  // console.log(uploads);

  res.render('public/search', {
    title: 'Search',
    uploads,
    channels: users,
    uploadServer,
    siteVisitor
  });
};


/**
 * GET /
 * Search page.
 */
exports.search = (req, res) => {
  res.render('public/search', {
    title: 'Search'
  });
};




/** TOTALLY UNFINISHED Organize uploads by the amount of the reacts they've received **/
exports.popularByReacts = async function (req, res){

  let uploads = await Upload.find({ reacts: { $exists: true }  }).populate('reacts uploader');

  uploads = _.filter(uploads, function(upload){
    return upload.reacts.length !== 0
  });

  uploads = uploads.sort(function(a, b) {
    return b.reacts.length - a.reacts.length
  });

  // console.log(uploads);

  for(upload of uploads){
    upload.checkedViews = [];
  }

  console.log(uploads);

  res.render('public/popularByReacts', {
    title : 'Popular By Reacts',
    uploads
  });
};

