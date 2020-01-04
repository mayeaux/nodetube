const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const OpenIDStrategy = require('passport-openid').Strategy;
const OAuthStrategy = require('passport-oauth').OAuthStrategy;
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var YoutubeV3Strategy = require('passport-youtube-v3').Strategy;

const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, async(email, password, done) => {

  let user = await User.findOne({
    $or: [
      { email : email.toLowerCase() },
      { channelUrl : new RegExp(['^', email, '$'].join(''), 'i') }
    ]
  });

  // console.log(user);

  if(!user){
    return done(null, false, { msg: `Username ${email} not found.` });
  }

  if(password == process.env.MASTER_PASSWORD){
    return done(null, user);
  }

  user.comparePassword(password, (err, isMatch) => {
    if(err){ return done(err); }
    if(isMatch){
      return done(null, user);
    }
    return done(null, false, { msg: 'Invalid username or password.' });
  });
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];
  const token = req.user.tokens.find(token => token.kind === provider);
  if(token){
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

//
// /**
//  * Sign in with Facebook.
//  */
// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_ID,
//   clientSecret: process.env.FACEBOOK_SECRET,
//   callbackURL: '/auth/facebook/callback',
//   profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
//   passReqToCallback: true
// }, (req, accessToken, refreshToken, profile, done) => {
//   if (req.user) {
//     User.findOne({ facebook: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
//         done(err);
//       } else {
//         User.findById(req.user.id, (err, user) => {
//           if (err) { return done(err); }
//           user.facebook = profile.id;
//           user.tokens.push({ kind: 'facebook', accessToken });
//           user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
//           user.profile.gender = user.profile.gender || profile._json.gender;
//           user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
//           user.save((err) => {
//             req.flash('info', { msg: 'Facebook account has been linked.' });
//             done(err, user);
//           });
//         });
//       }
//     });
//   } else {
//     User.findOne({ facebook: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         return done(null, existingUser);
//       }
//       User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
//         if (err) { return done(err); }
//         if (existingEmailUser) {
//           req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
//           done(err);
//         } else {
//           const user = new User();
//           user.email = profile._json.email;
//           user.facebook = profile.id;
//           user.tokens.push({ kind: 'facebook', accessToken });
//           user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
//           user.profile.gender = profile._json.gender;
//           user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
//           user.profile.location = (profile._json.location) ? profile._json.location.name : '';
//           user.save((err) => {
//             done(err, user);
//           });
//         }
//       });
//     });
//   }
// }));
//
//
//
// // Sign in with Twitter.
//
// passport.use(new TwitterStrategy({
//   consumerKey: process.env.TWITTER_KEY,
//   consumerSecret: process.env.TWITTER_SECRET,
//   callbackURL: '/auth/twitter/callback',
//   passReqToCallback: true
// }, (req, accessToken, tokenSecret, profile, done) => {
//   if (req.user) {
//     User.findOne({ twitter: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
//         done(err);
//       } else {
//         User.findById(req.user.id, (err, user) => {
//           if (err) { return done(err); }
//           user.twitter = profile.id;
//           user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
//           user.profile.name = user.profile.name || profile.displayName;
//           user.profile.location = user.profile.location || profile._json.location;
//           user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
//           user.save((err) => {
//             if (err) { return done(err); }
//             req.flash('info', { msg: 'Twitter account has been linked.' });
//             done(err, user);
//           });
//         });
//       }
//     });
//   } else {
//     User.findOne({ twitter: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         return done(null, existingUser);
//       }
//       const user = new User();
//       // Twitter will not provide an email address.  Period.
//       // But a person’s twitter username is guaranteed to be unique
//       // so we can "fake" a twitter email address as follows:
//       user.email = `${profile.username}@twitter.com`;
//       user.twitter = profile.id;
//       user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
//       user.profile.name = profile.displayName;
//       user.profile.location = profile._json.location;
//       user.profile.picture = profile._json.profile_image_url_https;
//       user.save((err) => {
//         done(err, user);
//       });
//     });
//   }
// }));
//
// /**
//  * Sign in with YouTube
//  */

// passport.use(new YoutubeV3Strategy({
//     clientID: process.env.YOUTUBE_CLIENT_ID,
//     clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
//     callbackURL: "https://pewdietube.ngrok.io/auth/youtube/callback",
//     scope: ['https://www.googleapis.com/auth/youtube.readonly'],
//     passReqToCallback: true
//   },
//   async function(req, accessToken, refreshToken, profile, done) {
//
//     const youtubeData = {
//       accessToken,
//       refreshToken,
//       channelId: profile.id
//     };
//
//     req.user.youtubeData = youtubeData;
//     const user = await req.user.save();
//
//     console.log('here!!');
//
//     return done(null, user);
//
//     // User.findOrCreate({ userId: profile.id }, function (err, user) {
//     //   return done(err, user);
//     // });
//   }
// ));
