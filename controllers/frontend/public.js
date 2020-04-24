const redisClient = require('../../config/redis');

const getFromCache = require('../../caching/getFromCache');
const uploadHelpers = require('../../lib/helpers/settings');
const uploadServer = uploadHelpers.uploadServer;

const Upload = require('../../models/index').Upload;

const logCaching = process.env.LOG_CACHING;
const defaultLandingPage = process.env.DEFAULT_LANDING_PAGE;

// TODO: pull into its own func
let indexResponse;
async function setIndex(){
  indexResponse = await redisClient.hgetallAsync('indexValues');
  if(logCaching == 'true'){
    console.log('got index cache');
  }
}

// get the index if its not a filehost
if(!process.env.FILE_HOST  || process.env.FILE_HOST == 'false'){
  setIndex();
  setInterval(function(){
    setIndex();
  }, 1000 * 60 * 2);
}

/**
 * GET /
 * Home page.
 */
exports.index = async(req, res) => {

  const title = "Home";

  if(defaultLandingPage == "globe") {

    // get 150 most popular uploads in last 24h that are sfw and from any category
    let uploads = await getFromCache.getPopularUploads("24hour", 150, 0, "all", "SFW", "all", "");

    res.render('public/globe', {
      title,
      uploadServer,
      uploads
    });

  } else {

    const response = indexResponse;
    let mediaAmount, channelAmount, viewAmount;

    if(!response){
      mediaAmount = 0;
      channelAmount = 0;
      viewAmount = 0;
    } else {
      mediaAmount = response.mediaAmount;
      channelAmount = response.channelAmount;
      viewAmount = response.viewAmount;
    }

    res.render('public/home', {
      title,
      mediaAmount,
      channelAmount,
      viewAmount,
      uploadServer
    });

  }
};

/**
 * GET /globe
 * Globe page.
 */
exports.globe = async(req, res) => {

  let uploads = await getFromCache.getPopularUploads("24hour", 150, 0, "all", "SFW", "all", "");

  res.render('public/globe', {
    title: 'Globe',
    uploadServer,
    uploads
  });
};

/**
 * GET /
 * About page.
 */
exports.about = (req, res) => {
  res.render('public/about', {
    title: 'About'
  });
};

/**
 * GET /tos
 * Terms of service page
 */
exports.tos = async(req, res) => {

  res.render('public/tos', {
    title: 'Terms Of Service'
  });
};

/**
 * GET /privacy
 * Privacy policy
 */
exports.privacy = async(req, res) => {
  // res.render('privacy', {
  //   title: 'Privacy'
  // })
  res.send('public/privacy');
};

/**
 * GET /embed/$uploadUniqueTag
 * Embed page
 */
exports.getEmbed = async function(req, res){

  res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + req.query.domain);

  const uniqueTag = req.params.uniqueTag;

  let upload = await Upload.findOne({
    uniqueTag,
    visibility: { $ne: 'removed' }
  }).populate({path: 'uploader comments checkedViews reacts', populate: {path: 'commenter receivedSubscriptions'}}).exec();

  if(!upload){
    console.log('Visible upload not found');
    res.status(404);
    return res.render('error/404');
  }

  res.render('public/embed', {
    title: 'Embed',
    upload,
    protocolDomainNameAndTLD: process.env.DOMAIN_NAME_AND_TLD
  });
};

/**
 * GET /docs
 * Docs page
 */
exports.getDocs = async(req, res) => {

  res.render('public/docs', {
    title: 'Docs'
  });
};
