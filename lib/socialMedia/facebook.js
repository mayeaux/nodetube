var rp = require('request-promise');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('unhandledRejection', console.log);

dotenv.load({ path: '../.env.example' });

const Upload = require('../../models/index').Upload;

/** IFTTT **/
const event = 'shillFacebookPage';

const token = process.env.IFTTT_TOKEN;
const endpoint = `https://maker.ifttt.com/trigger/${event}/with/key/${token}`;

async function buildMessage(uniqueTag, distance){
  const upload = await Upload.findOne({ uniqueTag }).populate('uploader');

  let contentAuthor = `${upload.uploader.channelName || upload.uploader.channelUrl}`;

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

/** **/

async function buildOptions(message, upload){
  upload = await Upload.findOne({ _id: upload._id }).populate('uploader');

  const body = {
    "value1":  message,
    "value2": `https://pewtube.com/user/${upload.uploader.channelUrl}/${upload.uniqueTag}`
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

async function facebookPost(message, upload){
  const options = await buildOptions(message, upload);

  const response = await rp.post(options);
  return response
}

module.exports = {
  facebookPost,
  buildMessage
};