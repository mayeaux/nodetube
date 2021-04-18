const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;

const Subscription = require('../../models/index').Subscription;
const PushEndpoint = require('../../models/index').PushEndpoint;
const PushSubscription = require('../../models/index').PushSubscription;
const EmailSubscription = require('../../models/index').EmailSubscription;

// const { protonmailTransport } = require('../../config/protonmailTransport');
const pushNotificationLib = require('../../lib/mediaPlayer/pushNotification');
const { zohoTransport } = require('../../config/nodemailer');
const mailJet = require('../../lib/emails/mailjet');

const sendgrid = require('../../lib/emails/sendgrid');


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

// TODO: this is not the correct place for this

/** for all of the users of those push subscription, scroll through and hit their active **/
async function updateUsersPushNotifications(user, upload){

  // find all subs of people who are subbed to the current user
  const pushSubscriptions = await PushSubscription.find({
    subscribedToUser : user._id,
    active: true
  });

  // loop through all the user's subs
  for(const sub of pushSubscriptions){
    // console.log(sub.subscribingUser);

    let url, icon, image = '';

    url = `/user/${user.channelUrl}/${upload.uniqueTag}`;

    const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;

    const pushTitle = `New upload by: ${user.channelName || user.channelUrl}: ${upload.title}`

    const pushPayload = `url=${url}&$description=${upload.description}&image${uploadedImage}&icon=${uploadedImage}&title=${pushTitle}&description=${upload.description}`;


    const endpoints = await PushEndpoint.find({
      user: sub.subscribingUser,
      expired: false
    })

    for(const endpoint of endpoints){
      try {
        pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload);
      } catch (err){
        console.log(err);
      }
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

async function updateUsersEmailNotifications(user, upload, host){


  // TODO : have to know what the upload's user's thing

  // subscribingUser : user who is subscribing
  // subscribedToUser : user is receiving a subscription

  // Get list of users who have an email subscription with this user
  const emailSubscriptionsForUser = await EmailSubscription.find({
    // the user whose content was subscribed to
    subscribedToUser : user._id,
    // make sure it's active
    active: true
  });



  // find all the email subscribers for the email subscription

  // console.log("updateUsersEmailNotifications -> emailSubscriptions", emailSubscriptionsForUser)


  // loop through all the user's subs
  for(const emailSubscription of emailSubscriptionsForUser){

    // get the id of the user who is subscribing
    const subscribingUserId = emailSubscription.subscribingUser;

    // find the user so you can find their email and send it off to them

    // get the user who is subscribing so we can get their email
    const userToFindEmail = await User.findOne({
      _id : subscribingUserId
    })

    const emailOfSubscribedUser = userToFindEmail.email;

    // console.log('upload');
    // console.log(upload);

    // console.log(userToFindEmail);

    // console.log(emailSubscription.subscribingUser);

    let url, icon, image = '';

    url = `/user/channelUrl/${upload.uniqueTag}`;

    const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;

    // const mailOptions = {
    //   to: userToFindEmail.email,
    //   subject: `New upload by: ${user.channelUrl}: ${upload.title}`,
    //   body: `
    //   ${user.channelUrl} has uploaded a new ${upload.fileType}: ${upload.title}.
    //     <button>Watch now!</button>
    //     // TODO: what can we all stick in here?
    //     <img src='https://newtube.app/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg' alt='Video preview' width='500' height='600'>
    //   `
    // };

    const emailText = `${user.channelUrl} has uploaded a new ${upload.fileType}: ${upload.title}:\n\n
      Please click on the following link, or paste this into your browser to view the upload:\n\n
      http://${host}/user/${user.channelUrl}/${upload.uniqueTag}\n\n
      You are receiving this email because you are subscribed to ${user.channelUrl} on NewTube.app\n`

    const mailOptions = {
      userEmail: emailOfSubscribedUser,
      userName: user.channelName || user.channelUrl,
      subject: `New upload by: ${user.channelUrl}: ${upload.title}`,
      text: emailText
    };

    try {
      const response = await sendgrid.sendEmail(mailOptions)
      console.log(response.body);

    } catch (err){
      console.log(err);
    }

  }
}

// user is used to build the the path
async function alertAdminOfNewUpload(user, upload){

  const admins = await User.find({ role : 'admin' }).select('_id');

  // console.log(admins);

  let idArray = [];
  for(const admin of admins){
    idArray.push(admin._id);
  }

  for(const id of idArray){
    const pushEndpoints = await PushEndpoint.find({ user: id, expired: false });

    // console.log(pushEndpoints);

    let url, icon, image = '';

    url = `/user/channelUrl/${upload.uniqueTag}`;

    const uploadedImage = `/uploads/${user.channelUrl}/${upload.uniqueTag}.jpg`;

    const pushTitle = `New upload by: ${user.channelUrl}: ${upload.title}`

    const pushPayload = `url=${url}&$description=${upload.description}&image${uploadedImage}&icon=${uploadedImage}&title=${pushTitle}&description=${upload.description}`;

    for(const endpoint of pushEndpoints){
      // console.log(endpoint);
      // console.log(pushPayload);
      pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload, endpoint);
    }

  }

  // console.log(idArray)


  // TODO: push notification functionality
  // const pushEndpoints = await PushEndpoint.find({ user, expired: false });
  //
  // // console.log(pushEndpoints);
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
  //   // console.log(endpoint);
  //   // console.log(pushPayload);
  //   pushNotificationLib.sendPushNotification(endpoint.subscription, pushPayload);
  // }
}

module.exports = {
  markUploadAsComplete,
  updateUsersUnreadSubscriptions,
  runTimeoutFunction,
  userCanUploadContentOfThisRating,
  bytesToMb,
  bytesToGb,
  updateUsersPushNotifications,
  updateUsersEmailNotifications,
  alertAdminOfNewUpload
};

