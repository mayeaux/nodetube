const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

const defaultMaxSizeUpload = process.env.DEFAULT_MAX_UPLOAD_SIZE_IN_MB || 500;

if(!defaultMaxSizeUpload){
  throw new Error('Default max size is not set properly on the Upload model file. ' +
    'See DEFAULT_MAX_UPLOAD_SIZE_IN_MB in .env.settings.sample');
}

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  emailConfirmed: { type: Boolean, default: false },
  emailConfirmationToken : String,
  emailConfirmationExpires: String,

  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'support'],
    default: 'user'
  },

  // TODO: this should be indexed, no?
  // channel username, unique url and identifier
  channelUrl: { type: String, unique: true, required: true, uniqueCaseInsensitive: true },

  verified: {
    type: Boolean,
    default: false
  },

  userUploadServer: { type: String, enum: ['uploads1', 'uploads3' ] },

  usedUploadServers: Array,

  channelName: { type: String  },
  channelDescription: { type: String },

  channelLocation : { type: String },

  youtubeChannelId: String,
  youtubeUsername: String,

  receivedSubscriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  }],

  subscriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  }],

  facebook: String,
  twitter: String,
  google: String,
  tokens: Array,

  uploads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }],

  // privileges
  privs : {
    // allow user to be trusted and not need moderation
    autoVisibleUpload: {
      type: Boolean,
      default: false
    },
    // automatically mirror uploads from youtube
    mirrorFunctionality: {
      type: Boolean,
      default: false
    },
    // unlisted uploads
    unlistedUpload: {
      type: Boolean,
      default: false
    },
    // private uploads
    privateUpload: {
      type: Boolean,
      default: false
    },
    // backup full youtube channel
    youtubeBackup: {
      type: Boolean,
      default: false
    },
    // unit is MB
    uploadSize : {
      type: Number,
      default: defaultMaxSizeUpload
    },
    // if the user is alowed to make SFW uploads (can remove priv for users who don't mark properly)
    safeForWorkUpload: {
      type: Boolean,
      default: true
    },
    // if the user is allowed to stream to the backend
    livestreaming: {
      type: Boolean,
      default: false
    },
    // if the user is allowed to stream to the backend
    importer: {
      type: Boolean,
      default: false
    }
  },

  userSettings : {
    mirrorOn: {
      type: Boolean,
      default: false
    },
    backupOn: {
      type: Boolean,
      default: false
    },
    monetizationOn: {
      type: Boolean,
      default: false
    }
  },

  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],

  userData: {
    ips: Array
  },

  // restricted = deleted
  // the only status is "restricted" which denotes deleted. Almost better to just do deleted as boolean
  status: String,

  filter: { type: String, enum: ['allAges', 'mature', 'sensitive'], default: 'allAges' },

  // profile: {
  //   name: String,
  //   gender: String,
  //   location: String,
  //   website: String,
  //   picture: String
  // },

  socialMedia: {
    twitter: String,
    facebook: String
  },

  // TODO: horrific name, should rename to indicate its the backblaze response
  thumbnailUrl: String,

  /** such as `user-thumbnail${fileExtension}`; **/
  customThumbnail: String,

  uploadToken: String,

  youTubeData: Schema.Types.Mixed,

  plan: {
    type: String,
    enum: ['free', 'plus'],
    default: 'free'
  },

  unseenSubscriptionUploads : {
    type: Number,
    default: 0
  },

  curated : {
    type: Boolean,
    default: false
  },

  // customer ID returned by stripe
  stripeCustomerId: {
    type: String
  },

  // date that the app will look at to know when to change a user back to free from a paid account
  subscriptionCancellationDate: {
    type: Date
  },

  // amount of usd credits in cents
  credit : {
    type: Number,
    default: 0
  },

  receivedCredit: {
    type: Number,
    default: 0
  },

  defaultQuality: {
    type: String,
    enum: ['high', 'low'],
    default: 'low'
  },

  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  pushNotificationEndpoints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PushEndpoint'
  }]

}, { timestamps: true, minimize: false });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next){
  const user = this;
  if(!user.isModified('password')){ return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if(err){ return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if(err){ return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb){
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size){
  if(!size){
    size = 200;
  }
  if(!this.email){
    return`https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return`https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

userSchema.plugin(uniqueValidator);

module.exports = User;
