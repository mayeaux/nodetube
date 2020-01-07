var Promise = require('bluebird');
var graph = Promise.promisifyAll(require('fbgraph'));

const fbAppToken = process.env.FACEBOOK_APP_TOKEN;

graph.setAccessToken(fbAppToken);

const userId = process.env.FACEBOOK_ID;

const ptPageId = process.env.FACEBOOK_PAGE_ID;

const Upload = require('../../models/index').Upload;

const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;

function buildWallPost(message, link){
  const wallPost = {
    message: message,
    link: link
  };

  return wallPost
}


async function facebookPost(message, upload){

  upload = await Upload.findOne({ _id : upload._id }).populate('uploader');

  const link = `https://${domainNameAndTLD}/user/${upload.uploader.channelUrl}/${upload.uniqueTag}`;

  const wallPost = buildWallPost(message, link);

  const response = await graph.postAsync(ptPageId + "/feed", wallPost);
  // console.log(response);

  return response
}


module.exports = {
  facebookPost
};


/** EXTEND TOKEN **/
// graph.extendAccessToken({
//   "access_token":    fbToken
//   , "client_id":      app_id
//   , "client_secret":  app_secret
// }, function (err, facebookRes) {
//
//   if(err){
//     console.log('err');
//     console.log(err);
//   }
//
//   console.log(facebookRes);
// });
