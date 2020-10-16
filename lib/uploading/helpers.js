const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;

const Subscription = require('../../models/index').Subscription;
const PushEndpoint = require('../../models/index').PushEndpoint;
const PushSubscription = require('../../models/index').PushSubscription;


const pushNotificationLib = require('../../lib/mediaPlayer/pushNotification');

// can't we just pass the upload, why have to hit the db?
async function markUploadAsComplete(uniqueTag, channelUrl, user, res){
  upload = await Upload.findOne({ uniqueTag });
  upload.status = 'completed';

  upload.processingCompletedAt = new Date();

  await upload.save();

  user.uploads.push(upload._id);
  await user.save();

  return 'success'
}

async function updateUsersUnreadSubscriptions(user){
  const subscriptions = await Subscription.find({ subscribedToUser: user._id, active: true });

  for(const subscription of subscriptions){
    let subscribingUser = await User.findOne({ _id: subscription.subscribingUser });
    if(subscribingUser){
      subscribingUser.unseenSubscriptionUploads = subscribingUser.unseenSubscriptionUploads + 1;
      await subscribingUser.save();
    }
  }

};

function runTimeoutFunction(){
  (async function(){
    await Promise.delay(1000 * 25);

    let timeoutUpload = await Upload.findOne({uniqueTag});

    if(timeoutUpload.status !== 'completed'){
      // note the upload is still processing
      timeoutUpload.status = 'processing';
      await timeoutUpload.save();

      uploadLogger.info('Still processing after 25s', logObject);

      // note that we've responded to the user and send them to processing page
      if(!responseSent){
        responseSent = true;
        res.send({
          message: 'ABOUT TO PROCESS',
          url: `/user/${channelUrl}/${uniqueTag}`
        });
      }
    }
  })();
}

function userCanUploadContentOfThisRating(maxRatingAllowed, contentRating) {
  switch (maxRatingAllowed) {
    case 'SFW':
      if (contentRating === 'mature' || contentRating === 'sensitive') {
        return false;
      }
    case 'NSFW':
      if (contentRating === 'sensitive') {
        return false
      }
    case 'SENSITIVE':
      return true
    default:
      return true
  }
}

// TODO: need an explanation of this math
const bytesToMb = (bytes, decimalPlaces = 4) => {
  return(bytes / Math.pow(10,6)).toFixed(decimalPlaces);
};

const bytesToGb = (bytes, decimalPlaces = 4) => {
  return(bytes / Math.pow(10,9)).toFixed(decimalPlaces);
};

// check if already uploaded based on the title
async function checkIfAlreadyUploaded(user, title, logObject, res){
  // TODO: File size check

  const alreadyUploaded = await Upload.findOne({
    uploader: user._id,
    title,
    visibility: 'public',
    status: 'completed'
  });

  if(alreadyUploaded){
    uploadLogger.info('Upload title already uploaded', logObject);
    res.status(500);
    res.send({message: 'ALREADY-UPLOADED'});
    return true;
  }

  return false;
}

async function updateUsersPushNotifications(user, upload){

  // TODO: find all push subscriptions for that user that are active

  // for all of the users of those push subscription, scroll through and hit their active ____

  // find all subs of people who are subbed to the current user
  const pushSubscriptions = await PushSubscription.find({
    subscribedToUser : user._id,
    active: true
  });

  for(const sub of pushSubscriptions){
    console.log(sub.subscribingUser);

    let url, icon, image = '';

    url = `/user/channelUrl/${upload.uniqueTag}`;

    const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;

    const pushTitle = `New upload by: ${user.channelUrl}: ${upload.title}`

    const pushPayload = `url=${url}&$description=${upload.description}&image${uploadedImage}&icon=${uploadedImage}&title=${pushTitle}&description=${upload.description}`;


    const endpoints = await PushEndpoint.find({
      user: sub.subscribingUser,
      expired: false
    })

    for(const endpoint of endpoints){
      pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload);
    }
  }

  //
  // console.log(pushSubscriptions);
  //
  // console.log('push subscriptions');
  //
  // return
  //
  //
  //
  // // TODO: push notification functionality
  // const pushEndpoints = await PushEndpoint.find({ user, expired: false });
  //
  // console.log(pushEndpoints);
  //
  // let url, icon, image = '';
  //
  // url = `/user/channelUrl/${upload.uniqueTag}`;
  //
  // const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;
  //
  // const pushTitle = `New upload by: ${user.channelUrl}: ${upload.title}`
  //
  // const pushPayload = `url=${url}&$description=${upload.description}&image${uploadedImage}&icon=${uploadedImage}&title=${pushTitle}&description=${upload.description}`;
  //
  // for(const endpoint of pushEndpoints){
  //   console.log(endpoint);
  //   console.log(pushPayload);
  //   pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload);
  // }
}

async function alertAdminOfNewUpload(user, upload){

  const admins = await User.find({ role : 'admin' }).select('_id');

  console.log(admins);

  let idArray = [];
  for(const admin of admins){
    idArray.push(admin._id);
  }

  for(const id of idArray){
    const pushEndpoints = await PushEndpoint.find({ user: id, expired: false });

    console.log(pushEndpoints);

    let url, icon, image = '';

    url = `/user/channelUrl/${upload.uniqueTag}`;

    const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;

    const pushTitle = `New upload by: ${user.channelUrl}: ${upload.title}`

    const pushPayload = `url=${url}&$description=${upload.description}&image${uploadedImage}&icon=${uploadedImage}&title=${pushTitle}&description=${upload.description}`;

    for(const endpoint of pushEndpoints){
      console.log(endpoint);
      console.log(pushPayload);
      pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload);
    }

  }

  console.log(idArray)

  console.log('something 11');

  // TODO: push notification functionality
  const pushEndpoints = await PushEndpoint.find({ user, expired: false });

  console.log(pushEndpoints);

  let url, icon, image = '';

  url = `/user/channelUrl/${upload.uniqueTag}`;

  const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;

  const pushTitle = `New upload by: ${user.channelUrl}: ${upload.title}`

  const pushPayload = `url=${url}&$description=${upload.description}&image${uploadedImage}&icon=${uploadedImage}&title=${pushTitle}&description=${upload.description}`;

  for(const endpoint of pushEndpoints){
    console.log(endpoint);
    console.log(pushPayload);
    pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload);
  }
}

module.exports = {
  markUploadAsComplete,
  updateUsersUnreadSubscriptions,
  runTimeoutFunction,
  userCanUploadContentOfThisRating,
  bytesToMb,
  bytesToGb,
  updateUsersPushNotifications,
  alertAdminOfNewUpload
};


