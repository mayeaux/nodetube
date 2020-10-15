const webpush = require('web-push');


// I'll be getting this from a database call


// I'll already have this loaded from the notification area
const title = 'New upload by Tony Heller';
const description = 'Latest On The Second Wave  - 5:49 - The casedemic in the UK is the worst in history.';
const image = 'https://newtube.app/uploads/TonyHeller/T1Jy8mL.jpg';
const icon = 'https://newtube.app/uploads/TonyHeller/T1Jy8mL.jpg';
const url = 'https://newtube.app/user/TonyHeller/T1Jy8mL';


// you can load it up with all the things
const urlEncodedData = `url=${url}&$description=${description}&image${image}&icon=${icon}&title=${title}&description=${description}`;

function sendPushNotification(subscription, urlEncodedData){
  webpush.sendNotification(subscription, urlEncodedData);
}

const sub = {"endpoint":"https://fcm.googleapis.com/fcm/send/dMrhmLJHmXk:APA91bFe_aOVDd_IG1gMdBK0iEsMr4Gd5TGi1o22cUCmXEL6eEMWOYIZnKIwZMrRq92WlJV53eiGe-ubzMwyNjGRhMUJT-Fm2W1PL5R8KupG-evwIAaQNP5rq9yXnMPAD0IG6rs2fJBh","expirationTime":null,"keys":{"p256dh":"BJ4z7B0mWG4hWn7rt8TH4rtu2g8YdBPHIN2iXnGHj4UvqIEKICYKUdZGie7e3U3C4vxPnfwdqqeK3NY-0PzKpHE","auth":"hZ65BZ_aoGWbjNtlq7TZOw"}}


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
sendPushNotification(sub, urlEncodedData);



exports = {
  sendPushNotification
};

