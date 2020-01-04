const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  ip: {
    type: String,
    required: true,
    index: true
  },
  siteUserData: mongoose.Schema.Types.Mixed,

  history: [String],
  refs: [String],

  visits: {
    type: Number,
    required: true,
    default: 1
  },

  doneFraud : {
    type: Boolean,
    default: false
  },

  filter : {
    type: String,
    default: 'allAges'
  },

  blocked : {
    type: Boolean
  },
  defaultQuality: {
    type: String,
    enum: ['high', 'low'],
    default: 'low'
  }

}, { timestamps: true });

const SiteVisit = mongoose.model('SiteVisit', siteVisitSchema);

module.exports = SiteVisit;

// is there a req.user?
//   if so, find all the siteVisit for user, does everything match? if so, increment
//   is the user the same but the ip different? make a new siteVisit with updated ip
//   is the ip the same but the site info is different? make a new sitevisit
//   is the ip the same and site info the same? increment
//   also, add user location

// const userAgentData = {
//   browser: useragent.browser,
//   version: useragent.version,
//   os: useragent.os,
//   platform: useragent.platform,
//   geoIp: useragent.geoIp,
//   trueStatements
// };

// https://github.com/bluesmoon/node-geoip
// optionally : block tor

