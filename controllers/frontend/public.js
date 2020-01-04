const redisClient = require('../../config/redis');

const Upload = require('../../models/index').Upload;

const logCaching = process.env.LOG_CACHING;

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

  // console.log('set index');

  res.render('public/home', {
    title: 'Home',
    mediaAmount,
    channelAmount,
    viewAmount
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
exports.tos = async(req, res, next) => {

  res.render('public/tos', {
    title: 'Terms Of Service'
  });
};

/**
 * GET /privacy
 * Privacy policy
 */
exports.privacy = async(req, res, next) => {
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
    upload
  });
};

