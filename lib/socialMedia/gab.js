var rp = require('request-promise');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Upload = require('../../models/index').Upload;

const endpoint = 'https://gab.ai/posts';

let laravel = process.env.GAB_AUTH;
let xsrf = process.env.GAB_XSRF;

async function buildMessage(uniqueTag, distance){
  const upload = await Upload.findOne({ uniqueTag }).populate('uploader');


  let contentAuthor;
  if(upload.uploader.socialMedia.gab){
    contentAuthor = '@' + upload.uploader.socialMedia.gab
  } else {
    contentAuthor = upload.uploader.channelName || upload.uploader.channelUrl;
  }

  let message;

  if(distance == 'short'){
    message = `${upload.title} \n\nhttps://pewtube.com/user/${upload.uploader.channelUrl}/${upload.uniqueTag}`;
  } else if(distance == 'long'){
    message = `${upload.title} by ${contentAuthor} \n\n https://pewtube.com/user/${upload.uploader.channelUrl}/${upload.uniqueTag} \n\n #PewTube`;
  } else if(distance == 'new'){
    message = `${upload.title} \n\n https://pewtube.com/user/${upload.uploader.channelUrl}/${upload.uniqueTag} \n\n Content by ${contentAuthor}`
  } else {
    throw new Error('Didnt understand distance')
  }

  return message
}

/** INSTRUCTIONS: GET THE FULL NASTY COOKIE AND CLIP OUT THE XSRF AND LARAVEL TOKEN PARTS AND USE THEM AS BELOW **/

function buildOptions(message){

  const body = {
    "body":  message,
    "reply_to": "",
    "is_quote": "0",
    "nsfw": "0",
    "_method": "post",
    "gif": "",
    "category": null,
    "topic": null,
    "share_facebook": null,
    "share_twitter": null,
    "is_replies_disabled": false,
    "media_attachments": []
  };

  const options = {
    uri: endpoint,
    method: 'POST',
    'x-xsrf-token': xsrf,
    headers: {
      authorization: `Bearer ${laravel}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
      accept:'application/json, text/javascript, */*; q=0.01',
      origin:'https://gab.ai',
      'content-type':'application/json',
  'accept-language':'en-US,en;q=0.8',
      Cookie: `laravel_session=${laravel}`
    },
    body,
    json: true
  };

  return options
}

async function gabPost(message){
  const options = buildOptions(message);

  const response = await rp.post(options);
  return response
}


async function oneOff(){
  const response = await gabPost('hello');
  console.log(response);
}

// oneOff()

module.exports = {
  buildMessage,
  gabPost
};