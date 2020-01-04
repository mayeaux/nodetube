const bluebird = require('bluebird');
const Promise = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = Promise.promisifyAll(require('passport'));
const fs = require('fs');
const path = require('path');
const captchapng = require('captchapng');
const _ = require('lodash');
const reCAPTCHA = require('recaptcha2');
const mongooseHelper = require('../../caching/mongooseHelpers');
var formidable = require('formidable');
const mv = require('mv');

const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;
const View = require('../../models/index').View;
const React = require('../../models/index').React;
const Comment = require('../../models/index').Comment;
const Notification = require('../../models/index').Notification;
const SiteVisit = require('../../models/index').SiteVisit;
const Subscription = require('../../models/index').Subscription;

const apiKey = 'AIzaSyByk-KTWDqwVejYLHUwKa6VFBTMe0lnQNk';
const requestModule = require('request');
const request = Promise.promisifyAll(requestModule);

// pewdie = UC-lHJZR3Gqxm24_Vd_AJ5Yw

async function testId(channelId){

  // test if it was a username
  const testUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forUsername=${channelId}&part=id`;

  // get request to api
  let response =  await request.getAsync(testUrl);

  const body = JSON.parse(response[0].body);

  console.log(body.items);

  // if there are items return the first item id
  if(body.items && body.items[0]){
    console.log(`'username, returning id:  ( ${body.items[0].id} )` );
    return body.items[0].id;
  } else {

    // if there are no items try by id
    let channelAPI = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}` +
      `&channelId=${channelId}&part=snippet,id&order=date&maxResults=50`;

    const nextResponse =  await request.getAsync(channelAPI);

    // parse json
    const body = JSON.parse(nextResponse[0].body);

    // return channelId if exists
    if(body.items && body.items[0]){
      console.log(`'username, returning id:  ( ${channelId} )` );
      return channelId;
    }

    // returning false as default
    console.log('returning false');

    return false;

  }

}

/**
 * POST /account/backup
 * Add backup functionality (receive channelId)
 */
exports.saveYouTubeChannelId = async(req, res, next) => {

  // SAVE CHANNEL ILD
  if(req.body.youtubeChannelId){

    const legitId = await testId(req.body.youtubeChannelId);

    if(legitId !== false){

      req.user.youtubeChannelId = legitId;
      let savedUser = await req.user.save();

      return res.send({
        message: 'updated channel id' ,
        channelId: legitId
      });

    } else {
      return res.send('not legit');
    }
  }

  // TURN BACKUP BUTTON ON AND OFF
  if(req.body.backupOn == 'true'){
    req.user.userSettings.backupOn = req.body.backupOn;

    console.log(req.body.backupOn);

    let savedUser = await req.user.save();
    console.log(savedUser);

    res.send('backup on');

  } else if(req.body.backupOn == 'false'){
    req.user.userSettings.backupOn = req.body.backupOn;
    let savedUser = await req.user.save();
    console.log(savedUser);

    res.send('backup off ');

  } else {
    res.send('miss');
  }

};
