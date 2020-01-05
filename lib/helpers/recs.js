const mongoose = require('mongoose');
const Upload = require('../../models/index.js').Upload;
const View = require('../../models/index.js').View;
const _ = require('lodash');

async function chronologicalRecs(upload){
  const uploads = await Upload.find({ uploader: upload.uploader._id }).select('title thumbnailUrl createdAt').lean();

  // console.log(uploads);

  return uploads;
  // do a for loop, 'before array and after array' , then combine them
}

module.exports = {
  getRecs : chronologicalRecs
};