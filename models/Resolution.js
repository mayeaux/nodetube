const mongoose = require('mongoose');
const _ = require('lodash');
const javascriptTimeAgo = require('javascript-time-ago');
javascriptTimeAgo.locale(require('javascript-time-ago/locales/en'));
require('javascript-time-ago/intl-messageformat-global');
require('intl-messageformat/dist/locale-data/en');

const resolutionSchema = new mongoose.Schema({

  fileSize: Number,
  resolution: { type: String, enum: ['240', '360', '480', '720', '1080'] },
  originalUpload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }

});