const _ = require('lodash');
const RSS = require('rss');
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

const { attachDataToUploadsAsUploads, attachDataToUploadsAsCategories } = require('../../lib/helpers/addFieldsToUploads');

const { getUploadDuration } = require('../../lib/mediaBrowsing/helpers');

const getSensitivityFilter =  uploadFilters.getSensitivityFilter;
const categories = require('../../config/categories');
const logCaching = process.env.LOG_CACHING;

// todo: get out of controller
let viewStats;

async function getStats(){
  let views = await redisClient.getAsync('dailyStatsViews');
  viewStats = JSON.parse(views);
}

if(!process.env.FILE_HOST  || process.env.FILE_HOST == 'false'){
  // update daily view stats per minute
  getStats();
  setInterval(function(){
    getStats();
  }, 1000 * 60 * 1);

}

// TODO: mediaBrowsing should be renamed media

const pageLimit = 42;

// TODO: pull out this function
function removeTrailingSlash(requestPath){
  if(requestPath.charAt(requestPath.length - 1) == '/'){
    requestPath = requestPath.substr(0, requestPath.length - 1);
  }

  return requestPath;
}

// TODO: pull this function out
async function addValuesIfNecessary(upload, channelUrl){
  if(upload.fileType == 'video' || upload.fileType == 'audio'){
    if(!upload.durationInSeconds || !upload.formattedDuration){

      var server = uploadServer;
      if(server.charAt(0) == '/') // the slash confuses the file reading, because host root directory is not the same as machine root directory
        server = server.substr(1);

      const uploadLocation = `${server}/${channelUrl}/${upload.uniqueTag + upload.fileExtension}`;

      try {
        const duration = await getUploadDuration(uploadLocation, upload.fileType);
        // console.log(duration);

        let uploadDocument = await Upload.findOne({uniqueTag: upload.uniqueTag});

        uploadDocument.durationInSeconds = Math.round(duration.seconds);
        uploadDocument.formattedDuration = duration.formattedTime;

        const saveDocument = await uploadDocument.save();
        // console.log(saveDocument);

      } catch(err){
        /** if the file has been deleted then it won't blow up **/
        // console.log(err);
      }

      // console.log('have to add');
    }
  }
}

/**
 * GET /media/recent
 * Page displaying most recently uploaded content
 */
exports.recentUploads = async(req, res) => {

  let requestPath = removeTrailingSlash(req.path);

  try {

    const mediaBrowsingType = 'recent';

    // console.log('getting recent uploads');

    const addressPrepend = '/media/recent';

    // get media page, either video, image, audio or all
    let media = req.query.media || 'all';

    let category = req.query.category || '';

    let subcategory = req.query.subcategory || '';

    // get current page
    let page = parseInt(req.params.page || 1);

    // limit amount to list per page
    let limit = pageLimit;

    if(!category || category == 'overview'){
      limit = 3;
    }

    const skipAmount = (page * limit) - limit;

    // get numbers for pagination
    const startingNumber = pagination.getMiddleNumber(page);
    const numbersArray = pagination.createArray(startingNumber);
    const previousNumber = pagination.getPreviousNumber(page);
    const nextNumber = pagination.getNextNumber(page);

    let filter = getSensitivityFilter(req.user, req.siteVisitor);

    let categoryObj;
    for(const cat of categories){
      if(cat.name == category){
        categoryObj = cat;
      }
    }
    // console.log(`CATEGORY: ${category}`);

    const mediaType = media;

    // TODO: this is really ugly, since it can return either an array or an array of arrays
    // TODO: very confusing, should pull out into two funcs or do anything else
    let uploads = await getFromCache.getRecentUploads(limit, skipAmount, mediaType, filter, category, subcategory);

    if(uploads && !uploads.map){
      uploads = attachDataToUploadsAsCategories(uploads);
    } else {
      uploads = attachDataToUploadsAsUploads(uploads);
    }

    // if(category && category !== 'overview'){
    //   for(const upload of uploads){
    //     addValuesIfNecessary(upload, upload.uploader.channelUrl);
    //   }
    // }

    // console.log('rendering');

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
      categoryObj,
      mediaBrowsingType,
      mediaType
    });

  } catch(err){
    console.log(err);
    res.status(500);
    res.send('error');
  }

};

/**
 * GET /media/popular
 * Page with all popular
 */
exports.popularUploads = async(req, res) => {

  // console.log('getting popular uploads');

  const mediaBrowsingType = 'popular';

  const addressPrepend = '/media/popular';

  // get media page, either video, image, audio or all
  let media = req.query.media || 'all';

  // TODO: pull this into a process var

  let category = req.query.category || 'all';

  // let 'overview' be passed as a category

  // let category = req.query.category || 'all';

  let subcategory = req.query.subcategory || '';

  let within = req.query.within;

  if(!within){
    within = '24hour';
  }

  // setup page
  let page = req.params.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  let limit = pageLimit;

  if(!category || category == 'overview'){
    limit = 3;
  }

  const skipAmount = (page * limit) - limit;

  // TODO: pull this out and export a function that returns an object with these values
  // then use ES6 syntax to declare them {}
  const startingNumber = pagination.getMiddleNumber(page);
  const numbersArray = pagination.createArray(startingNumber);
  const previousNumber = pagination.getPreviousNumber(page);
  const nextNumber = pagination.getNextNumber(page);

  const withinString = pagination.createWithinString(req.query.within);

  const englishString = pagination.createEnglishString(req.query.within);

  // console.log(englishString)

  //  amount to show in brackets that equals view amount in time period
  let viewAmountInPeriod;

  // console.log(`WITHIN: ${within}`);

  let displayObject = [{ withinString: '1hour', englishString: 'Last Hour' }, { withinString : '24hour', englishString: 'Last Day'},
    {withinString: '1week', englishString: 'Last Week'}
    , { withinString: '1month', englishString: 'Last Month' }, { withinString: 'alltime', englishString: 'All Time' }];

  // used for 'views per these returned items
  function calculateViewAmount(uploads){
    let viewCounter = 0;

    for(const checkUpload of uploads){
      // console.log(checkUpload);

      let stringToCheck;
      if(within == 'alltime'){
        stringToCheck = 'viewsAllTime';
      } else {
        stringToCheck = `viewsWithin${within}`;
      }
      const forThisUpload = checkUpload[stringToCheck];
      viewCounter = viewCounter + forThisUpload;
    }
    return viewCounter;
  }

  try {

    switch(englishString){
    case'Last Hour':
      viewAmountInPeriod = viewStats.hour;
      break;
    case'Last Day':
      viewAmountInPeriod = viewStats.day;
      break;
    case'Last Week':
      viewAmountInPeriod = viewStats.week;
      break;
    case'Last Month':
      viewAmountInPeriod = viewStats.month;
      break;
    case'All Time':
      viewAmountInPeriod = viewStats.alltime;
      break;
    }

    const timeRange = req.query.within;
    const mediaType = media;

    let filter = getSensitivityFilter(req.user, req.siteVisitor);

    let uploads = await getFromCache.getPopularUploads(timeRange, limit, skipAmount, mediaType, filter, category, subcategory);

    // show the view amount per the particular page
    // let viewsOnThisPage;
    // if(category){
    //   viewsOnThisPage = calculateViewAmount(uploads);
    // }

    // get the full category object from categories
    let categoryObj;
    for(const cat of categories){
      if(cat.name == category){
        categoryObj = cat;
      }
    }

    // TODO: create into its own function and import it

    // add the within string per the time overview
    let withinDisplayString = '';
    if(within == '1hour'){
      withinDisplayString = 'last hour';
    } else if(within == '24hour'){
      withinDisplayString = 'last 24 hours';
    } else if(within == '1week'){
      withinDisplayString = 'last week';
    } else if(within == '1month'){
      withinDisplayString = 'last month';
    }

    withinDisplayString = 'views ' + withinDisplayString;

    if(within == 'alltime'){
      withinDisplayString = '';
    }
    // TODO:

    const popularTimeViews = 'viewsWithin' + within;

    // console.log(popularTimeViews);
    //
    // console.log('getting popular uploads');

    if(uploads && uploads.length){
      for(const upload in uploads){

        // console.log(upload);
        addValuesIfNecessary(upload, upload.uploader && upload.uploader.channelUrl);
      }
    }

    let newUploads = {};
    if(uploads && !uploads.map){

      uploads = attachDataToUploadsAsCategories(uploads);

    } else {
      // if it's just a bunch of uploads, aka not the ugly categories thing
      uploads = attachDataToUploadsAsUploads(uploads);
    }

    // console.log(uploads);

    res.render('mediaBrowsing/popularUploads', {
      title: 'Popular Uploads',
      uploads,
      numbersArray,
      highlightedNumber: page,
      page,
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
      categoryObj,
      within,
      withinDisplayString,
      popularTimeViews,
      mediaBrowsingType,
      mediaType,
      displayObject
      // viewsOnThisPage
    });

  } catch(err){
    console.log('ERR:');
    console.log(err);

    res.status(500);
    return res.render('error/500', {
      title: 'Server Error'
    });
  }

};

async function saveSearchQuery(user, search){
  // note the person searching
  let searcher = user && user.id || undefined;

  // create and save search query
  const searchQuery = new SearchQuery({
    searcher: searcher,
    query: search
  });

  await searchQuery.save();

}

function capitalizeFirst(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getOrderByEnglishString(orderByQuery){
  let orderBy;
  if(!orderByQuery){
    orderBy = 'newToOld';
  } else {
    orderBy = orderByQuery;
  }

  if(orderBy !== 'popular' && orderBy !== 'newToOld' && orderBy !== 'oldToNew'){
    console.log('doesnt connect');
    orderBy = 'newToOld';
  }

  let orderByEnglishString;

  if(orderBy == 'oldToNew'){
    orderByEnglishString = 'Old To New';
  }

  if(orderBy == 'newToOld'){
    orderByEnglishString = 'New To Old';
  }

  if(orderBy == 'popular'){
    orderByEnglishString = 'Popular';
  }

  return orderByEnglishString;

}

/**
 * GET /
 * Search page.
 */
exports.search = async(req, res) => {

  // setup page
  let page = req.query.page;
  if(!page){ page = 1; }
  page = parseInt(page);

  let limit = 102;

  const skipAmount = (page * limit) - limit;

  const startingNumber = pagination.getMiddleNumber(page);
  const numbersArray = pagination.createArray(startingNumber);
  const previousNumber = pagination.getPreviousNumber(page);
  const nextNumber = pagination.getNextNumber(page);

  const uploadNumber = page * limit;

  const mediaType = req.query.mediaType;

  const userSearchQuery = req.query.searchQuery;

  if(!userSearchQuery){
    return res.render('public/search', {
      title: 'Search',
      orderBy: 'newToOld',
      searchQuery: ''
    });
  }

  await saveSearchQuery(req.user, userSearchQuery);

  let searchType = req.query.searchType;
  const orderBy = req.query.orderBy;

  let uploads, users;
  const re = new RegExp(userSearchQuery, 'gi');

  let totalUploadsAmount;

  if(searchType == 'user'){
    // channels
    users = await User.find({
      $or : [ { channelName: re }, { channelUrl: re  } ],
      status: { $ne: 'restricted'}
    }).populate('uploads');

    // only show users with at least one upload
    users = _.filter(users, function(user){
      return user.uploads.length > 0;
    });

  } else if(searchType == 'upload' || !searchType){
    const mediaType = req.query.mediaType;

    let searchQuery = {
      visibility: 'public',
      title : re,
      $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ]
    };

    if(mediaType && mediaType !== 'all'){
      searchQuery.fileType = mediaType;
    }

    let sortObj = '';
    if(orderBy == 'newToOld'){
      sortObj = {
        createdAt: -1
      };
    } else if(orderBy == 'oldToNew'){
      sortObj = {
        createdAt: 1
      };
    }

    // uploads
    uploads = await Upload.find(searchQuery).populate('uploader').sort(sortObj).limit(1000);

    totalUploadsAmount = uploads.length;

    // TODO: can just use views here
    // populate upload.legitViewAmount
    uploads = await Promise.all(
      uploads.map(async function(upload){
        upload = upload.toObject();
        const checkedViews = await View.countDocuments({ upload: upload.id, validity: 'real' });
        upload.legitViewAmount = checkedViews;
        return upload;
      })
    );

    let filter = getSensitivityFilter(req.user, req.siteVisitor);

    uploads = uploadFilters.filterUploadsBySensitivity(uploads, filter);

    if(orderBy == 'popular'){
      uploads = uploads.sort(function(a, b){
        return b.legitViewAmount - a.legitViewAmount;
      });
    }

    const helpers = require('../../lib/mediaBrowsing/helpers');

    uploads = helpers.trimUploads(uploads, limit, skipAmount);

    uploads = attachDataToUploadsAsUploads(uploads);

  } else {
    // error
  }

  const siteVisitor = req.siteVisitor;

  const media = mediaType || 'all';

  const orderByEnglishString = getOrderByEnglishString(orderBy);

  return res.render('public/search', {
    title: 'Search',
    channels: users,
    uploads,
    siteVisitor,
    media,
    orderByEnglishString,
    orderBy,
    mediaType,
    searchType,
    searchQuery: userSearchQuery,
    numbersArray,
    highlightedNumber: page,
    previousNumber,
    nextNumber,
    totalUploadsAmount,
    uploadNumber,
    uploadServer,
    capitalizeFirst
  });
};

/** TOTALLY UNFINISHED Organize uploads by the amount of the reacts they've received **/
exports.popularByReacts = async function(req, res){

  let uploads = await Upload.find({ reacts: { $exists: true }  }).populate('reacts uploader');

  uploads = _.filter(uploads, function(upload){
    return upload.reacts.length !== 0;
  });

  uploads = uploads.sort(function(a, b){
    return b.reacts.length - a.reacts.length;
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

exports.recentRssFeed = async(req, res) => {
  const uploads = await getFromCache.getRecentUploads(20, 0, 'all', 'sensitive', 'all', '');
  const feed = new RSS({
    title: process.env.INSTANCE_BRAND_NAME,
    description: process.env.META_DESCRIPTION,
    feed_url: `${process.env.DOMAIN_NAME_AND_TLD}/media/recent/rss`,
    site_url: process.env.DOMAIN_NAME_AND_TLD,
    image_url: process.env.META_IMAGE,
    copyright: `2020 ${process.env.INSTANCE_DOMAIN_NAME}`,
    language: 'en',
    pubDate: new Date(),
    ttl: '60'
  });

  uploads.map(item => {
    const { title, category } = item;
    const categories = [category];
    const author = item.uploader.channelUrl;
    const url = `${process.env.DOMAIN_NAME_AND_TLD}/user/${encodeURIComponent(author)}/${item.uniqueTag}`;

    feed.item({
      title,
      url, // link to the item
      guid: item._id, // optional - defaults to url
      categories, // optional - array of item categories
      author, // optional - defaults to feed author property
      date: item.createdAt // any format that js Date can parse.
    });
  });

  const xml = feed.xml({indent: true});
  res.send(xml);

  // TOOD: incorporate rss feed here and send it as response
};
