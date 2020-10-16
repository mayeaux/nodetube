const webpush = require('web-push');
const PushSubscription = require('../../models/index.js').PushSubscription;
const PushEndpoint = require('../../models/index.js').PushEndpoint;

const User = require('../../models/index.js').User;


// Given an upload, find all the web push noti


// I'll be getting this from a database call


async function sendPushNotifications(user){
  const subscriptions = await PushSubscription.find({ subscribedToUser: user._id, active: true });

  for(const subscription of subscriptions){
    let subscribingUser = await User.findOne({ _id: subscription.subscribingUser }).populate('pushNotificationEndpoints');

    // optionally you can just do a call to the db here (rather than populate)
    // const endpoints =



    for(const endpoint of subscribingUser.pushNotificationEndpoints){
      sendPushNotification(endpoint.subscription, urlEncodedData);
    }

  }

};


async function sendPushNotification(subscription, urlEncodedData, endpoint){
  try {
    await webpush.sendNotification(subscription, urlEncodedData);
  } catch (err){
    if(err.body == 'push subscription has unsubscribed or expired.\n' && endpoint) {
      endpoint.expired = true;
      await endpoint.save();
    } else {
      console.log('err');
      console.log(err);
    }

  }
}



function buildUrlEncodedDataFromUpload(upload){
  return `url=${url}&$description=${description}&image${image}&icon=${icon}&title=${title}&description=${description}`;

}


// I'll already have this loaded from the notification area
const title = 'New upload by Tony Heller';
const description = 'Latest On The Second Wave  - 5:49 - The casedemic in the UK is the worst in history.';
const image = 'https://newtube.app/uploads/TonyHeller/T1Jy8mL.jpg';
const icon = 'https://newtube.app/uploads/TonyHeller/T1Jy8mL.jpg';
const url = 'https://newtube.app/user/TonyHeller/T1Jy8mL';


// you can load it up with all the things
const urlEncodedData = `url=${url}&$description=${description}&image${image}&icon=${icon}&title=${title}&description=${description}`;


async function sendPushNotifications(){

  const endpoints = await PushEndpoint.find({ expired : { $ne: true } });

  for(const endpoint of endpoints){
    try {
      await webpush.sendNotification(endpoint.subscription, urlEncodedData);
    } catch (err){

      if(err.body == 'push subscription has unsubscribed or expired.\n'){
        endpoint.expired = true;
        await endpoint.save();

        console.log(endpoint.save)
        // push is unsubscribed or expired
        // TODO: mark as inactive
      } else {
        console.log(err);
      }
      // console.log(err.body == 'push subscription has unsubscribed or expired.\n');
    }
  }

};

// sendPushNotifications()

const sub =
  {
    "endpoint" : "https://fcm.googleapis.com/fcm/send/e-nUna5pp5o:APA91bG883eAud9IBCaOXnBYLJJQ0k0B9xHyX7KzEoNk-PtXlFafF4SHOo9vv_ITsEOkeJO6ejJhhYQ7Ln2GT2V1InM3Zb-qUbLQX77Ud7yS6xgXvRGcSRkk86hOEMO7woFVoStuSWRT",
    "expirationTime" : null,
    "keys" : {
      "p256dh" : "BOn8CSzbcLS03MtRVQXDrl-O9G6fCmPUppEuWwk_IoUSVwW6FosbIf9zQgZTc4oW1wGxM8ExWlX9Y49vHlucPzQ",
      "auth" : "iOm2maY443KOWK1loUA3Nw"
    }
  }


const vapidKeys = {
  publicKey: 'BJ5IxJBWdeqFDJTvrZ4wNRu7UY2XigDXjgiUBYEYVXDudxhEs0ReOJRBcBHsPYgZ5dyV8VjyqzbQKS8V7bUAglk',
  privateKey: 'ERIZmc5T5uWGeRxedxu92k3HnpVwy_RCnQfgek1x2Y4'
};

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// send the data to the endpoint, with the urlencoded string
// sendPushNotification(sub, urlEncodedData);



module.exports = {
  sendPushNotification,
  sendPushNotifications
};

