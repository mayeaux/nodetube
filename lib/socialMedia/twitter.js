var rp = require('request-promise');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('unhandledRejection', console.log);

const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;

const brandName = process.env.INSTANCE_BRAND_NAME;

dotenv.load({ path: '../.env.example' });

const Upload = require('../../models/index').Upload;

/** IFTTT **/
const event = 'shillTweet';
const token = process.env.IFTTT_TOKEN;
const endpoint = `https://maker.ifttt.com/trigger/${event}/with/key/${token}`;

async function buildMessage(uniqueTag, distance){
  const upload = await Upload.findOne({ uniqueTag }).populate('uploader');

  let contentAuthor;
  if(upload.uploader.socialMedia.twitter){
    contentAuthor = '@' + upload.uploader.socialMedia.twitter
  } else {
    contentAuthor = `${upload.uploader.channelName || upload.uploader.channelUrl}`;
  }

  let message;
  if(distance == 'short'){
    message = `${upload.title} \n\nhttps://${domainNameAndTLD}/user/${upload.uploader.channelUrl}/${upload.uniqueTag}`;
  } else if(distance == 'long'){
    message = `${upload.title} by ${contentAuthor} \n\n https://${domainNameAndTLD}/user/${upload.uploader.channelUrl}/${upload.uniqueTag} \n\n #${brandName}`;
  } else if(distance == 'new'){
    message = `${upload.title} \n\n https://${domainNameAndTLD}/user/${upload.uploader.channelUrl}/${upload.uniqueTag} \n\n Content by ${contentAuthor}`
  } else {
    throw new Error('Didnt understand distance')
  }

  return message
}

/** **/

function buildOptions(message){

  const body = {
    "value1":  message
  };

  const options = {
    uri: endpoint,
    method: 'POST',
    headers: {
      'content-type':'application/json',
    },
    body,
    json: true
  };

  // console.log(options);


  return options
}

async function twitterPost(message){
  const options = buildOptions(message);

  const response = await rp.post(options);
  return response
}

module.exports = {
  twitterPost,
  buildMessage
};