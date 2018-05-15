const _ = require('lodash');

const redisClient = require('../../config/redis');

const Promise = require('bluebird');

const pagination = require('../../lib/helpers/pagination');

const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const SearchQuery = require('../../models/index').SearchQuery;
const View = require('../../models/index').View;


const uploadHelpers = require('../../lib/helpers/settings');

const uploadServer = uploadHelpers.uploadServer;

const getFromCache = require('../../caching/getFromCache');

const uploadFilters = require('../../lib/mediaBrowsing/helpers');

const getSensitivityFilter =  uploadFilters.getSensitivityFilter;

const categories = require('../../config/categories');

console.log('UPLOAD SERVER: ' + uploadServer);



const mongooseHelpers = require('../../caching/mongooseHelpers');


/**
 * GET /media/recent
 * Page displaying most recently uploaded content
 */
exports.recentUploads = async (req, res) => {

  try {

    const addressPrepend = '/media/recent';

    // get media page, either video, image, audio or all
    let media = req.query.media || 'all';

    let category = req.query.category || '';

    let subcategory = req.query.subcategory || '';

    // get current page
    let page = parseInt(req.params.page || 1);

    // limit amount to list per page
    let limit = 102;

    if(!category){
      limit = 6
    }

    const skipAmount = (page * limit) - limit;

    // get numbers for pagination
    const startingNumber = pagination.getMiddleNumber(page);
    const numbersArray = pagination.createArray(startingNumber);
    const previousNumber = pagination.getPreviousNumber(page);
    const nextNumber = pagination.getNextNumber(page);

    let filter = getSensitivityFilter(req.user, req.siteVisitor);

    let categoryObj;
    for(const cat of categories) {
      if (cat.name == category) {
        categoryObj = cat
      }
    }

    const mediaType = media;

    const uploads = await getFromCache.getRecentUploads(limit, skipAmount, mediaType, filter, category, subcategory);

    res.render('mediaBrowsing/recentUploads', {
      title: 'Recent Uploads',
      uploads,
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber,
      media,
      uploadServer,
      siteVisitor: req.siteVisitor,
      categories,
      category,
      isACategory : category,
      addressPrepend,
      categoryObj
    });

  } catch (err){
    console.log(err);
    res.status(500);
    res.send('error')
  }

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



/**
 * GET /media/popular
 * Page with all popular
 */
exports.popularUploads = async (req, res) => {

  const addressPrepend = '/media/popular';

  // get media page, either video, image, audio or all
  let media = req.query.media || 'all';

  let category = req.query.category || '';

  let subcategory = req.query.subcategory || '';

  // setup page
  let page = req.params.page;
  if(!page){ page = 1 }
  page = parseInt(page);

  let limit = 102;

  if(!category){
    limit = 6
  };



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

    const timeRange = req.query.within;
    const mediaType = media;

    let filter = getSensitivityFilter(req.user, req.siteVisitor);

    // TODO: add func to get category=all
    let uploads = await getFromCache.getPopularUploads(timeRange, limit, skipAmount, mediaType, filter, category, subcategory);

    console.log(uploads.length + ' :length');
    console.log(uploads);
    console.log(uploads + ' :length');

    let categoryObj;
    for(const cat of categories) {
      if (cat.name == category) {
        categoryObj = cat
      }
    }


    res.render('mediaBrowsing/popularUploads', {
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
      siteVisitor : req.siteVisitor,
      categories,
      category,
      isACategory : category,
      media,
      addressPrepend,
      categoryObj
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

  const mediaType = req.query.mediaType;

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
    }).populate('uploader');

    // populate upload.legitViewAmount
    uploads = await Promise.all(
      uploads.map(async function(upload){
        upload = upload.toObject();
        const checkedViews = await View.count({ upload: upload.id, validity: 'real' });
        upload.legitViewAmount = checkedViews;
        return upload
      })
    );

    let filter = getSensitivityFilter(req.user, req.siteVisitor);

    uploads = uploadFilters.filterUploadsBySensitivity(uploads, filter);

    // TODO: how to get mediaType here?
    // TODO: answer: refactor into using a get API
    // uploads = uploadFilters.filterUploadsByMediaType(uploads, mediaType);

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

  const siteVisitor = req.siteVisitor;

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

