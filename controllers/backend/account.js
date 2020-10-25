/** UNFINISHED **/
/* eslint-disable no-unused-vars */

const bluebird = require('bluebird');
const Promise = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = Promise.promisifyAll(require('passport'));
const path = require('path');
const captchapng = require('captchapng');
const _ = require('lodash');
const reCAPTCHA = require('recaptcha2');
var formidable = require('formidable');
const mv = require('mv');
const fs = require('fs-extra');
const mkdirp = Promise.promisifyAll(require('mkdirp'));
const randomstring = require('randomstring');

const mailTransports = require('../../config/nodemailer');
// const {sendProtonMail} = require('../../config/protonmailTransport');

const importerDownloadFunction = require('../../lib/uploading/importer');

// importerDownloadFunction('anthony', 'https://www.youtube.com/watch?v=vLJgAAIfKEc');

// console.log('importer');
// console.log(importerDownloadFunction);

const mailgunTransport = mailTransports.mailgunTransport;
const zohoTransport = mailTransports.zohoTransport;


const User = require('../../models/index').User;
const getMediaType = require('../../lib/uploading/media');

const brandName = process.env.INSTANCE_BRAND_NAME;

const thumbnailServer = process.env.THUMBNAIL_SERVER || '';

const frontendServer = process.env.FRONTEND_SERVER || '';

const verifyEmailPassword = process.env.NODETUBE_VERIFY_EMAIL_PASSWORD;

const { saveAndServeFilesDirectory } = require('../../lib/helpers/settings');

const backblaze = require('../../lib/uploading/backblaze');

const recaptcha = new reCAPTCHA({
  siteKey : process.env.RECAPTCHA_SITEKEY,
  secretKey : process.env.RECAPTCHA_SECRETKEY
});

const { b2 } = require('../../lib/uploading/backblaze');
const pagination = require('../../lib/helpers/pagination');

// where to send users to after login
const redirectUrl = '/account';

/**
 * POST /login
 * Sign in using email and password.
 * Email value can either be email or channelUrl (username)
 */
exports.postLogin = async(req, res, next) => {
  // req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if(errors){
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  /** TODO: refactor without callbacks **/

  /** login with passport **/
  passport.authenticate('local', (err, user, info) => {

    if(err){ return next(err); }

    // redirect to login if no user
    if(!user){
      req.flash('errors', info);
      return res.redirect('/login');
    }

    // don't let restricted users login
    if(user.status == 'restricted'){
      req.flash('errors', { msg: 'There was an error logging, in please try again' });
      console.log('FAILED LOGIN ATTEMPT');
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if(err){ return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });

      // ?? i dont get this
      if(process.env.LIVESTREAM_APP == 'true'){
        // always redirect to sign-in url to see plus
        res.redirect(req.session.returnTo || redirectUrl);
        // res.redirect(`/user/${user.channelUrl}/live/staging`);
      } else {
        res.redirect(redirectUrl);
      }

    });
  })(req, res, next);
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = async(req, res, next) => {

  // CAPTCHA VALIDATION
  if(process.env.NODE_ENV == 'production' && process.env.RECAPTCHA_ON == 'true'){
    try {
      const response = await recaptcha.validate(req.body['g-recaptcha-response']);
    } catch(err){
      req.flash('errors', { msg: 'Captcha failed, please try again' });
      return res.redirect('/signup');
    }
  }

  /** assertion testing the data **/
  // req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  // req.assert('channelName', 'Channel name must be entered').notEmpty();
  req.assert('channelUrl', 'Channel username must be entered').notEmpty();
  req.assert('channelUrl', 'Channel username must be between 3 and 25 characters.').len(3,25);

  console.log(req.body.channelUrl + ' <--- inputted channelUrl for' + req.body.email);
  // console.log(req.body.grecaptcha.getResponse('captcha'));

  if(!/^\w+$/.test(req.body.channelUrl)){
    req.flash('errors', { msg: 'Please only use letters, numbers and underscores (no spaces) for your username.' });
    return res.redirect('/signup');
  }

  // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if(errors){
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  let user = new User({
    email: '' + Math.random() + Math.random(),
    password: req.body.password,
    channelUrl: req.body.channelUrl
    // channelName: req.body.channelName,
  });

  // make sure first user is admin, can refactor later
  const numberOfUsers = await User.countDocuments();

  if(numberOfUsers == 0){
    user.role = 'admin';
    user.plan = 'plus';
    user.privs.unlistedUpload = true;
    user.privs.privateUpload = true;
    user.privs.uploadSize = 2000;
    user.privs.livestreaming = true;
    user.privs.importer = true;
  }

  User.findOne({ channelUrl : req.body.channelUrl }, (err, existingUser) => {
    if(err){ return next(err); }
    if(existingUser){
      req.flash('errors', { msg: 'That channel username is taken, please choose another one.' });
      return res.redirect('/signup');
    }
    user.save((err) => {

      console.log(err);

      if(err && err.errors && err.errors.channelUrl && err.errors.channelUrl.kind == 'unique'){
        req.flash('errors', { msg: 'That channel username is taken, please choose another one' });
        return res.redirect('/signup');
      }

      if(err){ return next(err); }
      req.logIn(user, (err) => {
        if(err){
          return next(err);
        }

        const id = user.id;

        res.redirect(redirectUrl);
      });
    });
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = async(req, res, next)  => {

  console.log(`UPDATING PROFILE FOR ${'hello'}`);

  if(!req.user && req.body.uploadToken){
    req.user = await User.findOne({ uploadToken : req.body.uploadToken });
  }

  // console.log('REQ FILES')
  // console.log(req.files);

  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if(errors){
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  // load up file info
  let filename, fileType, fileExtension;
  if(req.files && req.files.filetoupload){
    filename = req.files.filetoupload.originalFilename;
    fileType = getMediaType(filename);
    fileExtension = path.extname(filename);

    console.log('FILE EXTENSION: ' + fileExtension);
  }

  const channelNameBetween3And20Chars = req.body.channelName.length < 3 &&  req.body.channelName.length < 0 || req.body.channelName.length > 20;

  if(channelNameBetween3And20Chars){
    console.log('SHOULDNT BE POSSIBLE: Someone messing with channelName?');
  }

  const fileIsNotImage = req.files && req.files.filetoupload && req.files.filetoupload.size > 0 && fileType && fileType !== 'image';

  const fileIsImage = req.files && req.files.filetoupload && req.files.filetoupload.size > 0 && fileType == 'image';

  // reject the file
  if(fileIsNotImage){
    return res.send('We cant accept this file');
    // save and upload image if conditions met
  } else if(fileIsImage){

    const channelUrlFolder = `${saveAndServeFilesDirectory}/${req.user.channelUrl}`;

    // make the directory if it doesnt exist
    await mkdirp.mkdirpAsync(channelUrlFolder);

    // save the file
    await fs.move(req.files.filetoupload.path, `${saveAndServeFilesDirectory}/${req.user.channelUrl}/user-thumbnail${fileExtension}`, {overwrite: true});

    // upload thumbnail to b2
    if(process.env.UPLOAD_TO_B2 == 'true'){
      await backblaze.uploadUserThumbnailToB2(req.user.channelUrl, fileExtension);
      // await uploadToB2thing(param)
    }

    req.user.customThumbnail = `user-thumbnail${fileExtension}`;

    // if no channel name is given, save it as the channel url
    req.user.channelName = req.body.channelName ?  req.body.channelName : req.user.channelUrl;

    req.user.channelDescription = req.body.description;

    await req.user.save();

    // download if theres an image
    return res.send('success');

  } else {

    let user = await User.findById(req.user.id);

    user.channelName = req.body.channelName ?  req.body.channelName : req.user.channelUrl;

    user.channelDescription = req.body.description;

    console.log(user);

    await user.save();

    // download if theres an image
    return res.send('success');
  }

};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if(errors){
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if(err){ return next(err); }
    user.password = req.body.password;
    user.save((err) => {
      if(err){ return next(err); }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if(err){ return next(err); }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = async(req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if(errors){
    req.flash('errors', errors);
    return res.redirect('back');
  }

  let user =  await User.findOne({ passwordResetToken: req.params.token }).where('passwordResetExpires').gt(Date.now());

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  req.flash('success', { msg: 'Success! Your password has been changed.' });

  const mailOptions = {
    to: user.email,
    from: process.env.NODETUBE_NOREPLY_EMAIL_ADDRESS,
    subject: `Your ${brandName} password has been reset`,
    text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
  };

  // turn an email noting that is ___
  const response = await zohoTransport.sendMail(mailOptions);

  // console.log(response);

  return res.redirect('/login');

};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = async(req, res, next) => {

  try {

    if(process.env.FORGOT_PASSWORD_EMAIL_FUNCTIONALITY_ON !== 'true'){
      return res.send('forgot email functionality not on');
    }

    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({gmail_remove_dots: false});

    const errors = req.validationErrors();

    const token = await crypto.randomBytes(16).toString('hex');

    let user = await User.findOne({email: req.body.email});

    if(!user){
      req.flash('info', {msg: 'If the email address exists you will receive further instructions on resetting your password there.'});
      return res.redirect('/forgot');
    } else {
      user.passwordResetToken = token;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      user = await user.save();
    }

    const mailOptions = {
      to: user.email,
      from: process.env.NODETUBE_NOREPLY_EMAIL_ADDRESS,
      subject: `Reset your password on ${brandName}`,
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://${req.headers.host}/reset/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    const response = await zohoTransport.sendMail(mailOptions);

    // console.log(response);

    req.flash('info', {msg: 'If the email address exists you will receive further instructions on resetting your password there.'});

    return res.redirect('/forgot');

  } catch(err){
    console.log(err);
    res.render('error/500');
  }
};

/**
 * POST /account/email
 * Create a random token, then the send user an email with a confirmation link
 */
exports.postConfirmEmail = async(req, res, next) => {

  try {

    if(process.env.CONFIRM_USER_EMAIL_FUNCTIONALITY_ON !== 'true'){
      return res.send('forgot email functionality not on');
    }

    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({gmail_remove_dots: false});

    const errors = req.validationErrors();

    const token = await crypto.randomBytes(16).toString('hex');

    let user = req.user;

    user.email = req.body.email;
    user.emailConfirmationToken = token;
    user.emailConfirmationExpires = Date.now() + 3600000; // 1 hour
    user = await user.save();

    console.log('User email: ', user.email);
    console.log('Confirmation email address: ', process.env.PROTONMAIL_USERNAME);

    const mailOptions = {
      to: user.email,
      from: process.env.NODETUBE_NOREPLY_EMAIL_ADDRESS,
      subject: `Confirm your email on ${brandName}`,
      text: `You are receiving this email because you (or someone else) has attempted to link this email to their account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://${req.headers.host}/confirmEmail/${token}\n\n
      If you did not request this, please ignore this email and no further steps will be needed.\n`
    };

    const response = await zohoTransport.sendMail(mailOptions);

    // console.log(response);

    req.flash('info', {msg: 'An email has been sent to your address to confirm your email'});

    return res.redirect('/account');

  } catch(err){

    console.log(err);

    // if the email is already in use
    if(err && err.errors && err.errors.email && err.errors.email.kind && ( err.errors.email.kind == 'unique')){
      req.flash('errors', { msg: 'That email is already in use, please try another' });
      res.redirect('/account');
    } else {
      res.render('error/500');
    }
  }
};

/**
 * POST /importer
 * Importer page.
 */
exports.postImporter = async(req, res) => {

  const youtubeLink = req.body.youtubeLink;

  const channelUrl = req.user.channelUrl;

  console.log(req.body);

  console.log('now ' + new Date());

  const uniqueTag = await importerDownloadFunction(channelUrl, youtubeLink);

  if(uniqueTag == 'playlist'){
    return res.send({
      uniqueTag: 'playlist',
      channelUrl
    });
  }

  console.log('now ' + new Date());

  return res.send({
    uniqueTag,
    channelUrl
  });
};