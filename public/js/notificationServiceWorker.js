// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
const urlB64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for(let i = 0; i < rawData.length; ++i){
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// this is basically the post request after you click a button
const saveSubscription = async subscription => {
  const SERVER_URL = 'http://localhost:3000/save-subscription';

  console.log(subscription);

  const response = await fetch(SERVER_URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscription)
  });
  return response.json();
};

// SETUP LOCAL NOTIFICATION TO SHOW VIA NOTIFICATION API
const showLocalNotification = async(body, swRegistration) => {

  console.log(body);
  const params = new URLSearchParams(body);

  const url = params.get('url');
  const description = params.get('description');
  const image = params.get('image');
  const icon = params.get('icon');
  const data = params.get('data');
  const title = params.get('title');

  const badge = icon;

  const options = {
    body: description,
    image,
    icon,
    data: url,
    badge
    // here you can add more properties like icon, image, vibrate, etc.
  };
  return swRegistration.showNotification(title, options);
};

self.addEventListener('notificationclick', function(event){
  console.log(event);

  // this contains a bunch of info on the notification, icon image and all that stuff
  const notification = event.notification;

  // url was passed in the data thing
  const url = event.notification.data;
  console.log('text ' + url);

  event.notification.close(); // Android needs explicit close.

  // no idea how this work but I grabbed it from SO and it works fine
  event.waitUntil(
    clients.matchAll({type: 'window'}).then( windowClients => {
      // Check if there is already a window/tab open with the target URL
      for(var i = 0; i < windowClients.length; i++){
        var client = windowClients[i];
        // If so, just focus it.
        if(client.url === url && 'focus' in client){
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if(clients.openWindow){
        return clients.openWindow(url);
      }
    })
  );
});

// when you receive a push, start a new notif
self.addEventListener('push', function(event){
  console.log(event);
  if(event.data){
    console.log('Push event!! ', event.data.text());

    // event data text is the payload text
    return showLocalNotification(event.data.text(), self.registration);
  } else {
    console.log('Push event but no data');
  }
});

// public key for VAPID

const publicKey = 'BJ5IxJBWdeqFDJTvrZ4wNRu7UY2XigDXjgiUBYEYVXDudxhEs0ReOJRBcBHsPYgZ5dyV8VjyqzbQKS8V7bUAglk';
// convert this string somehow
const applicationServerKey = urlB64ToUint8Array(publicKey);

// set key and option for chrome
const options = {
  applicationServerKey,
  userVisibleOnly: true
};

console.log(options);

self.addEventListener('activate', async() => {
  // This will be called only once when the service worker is activated.
  try {

    // register through pushmanager a new subscription
    const subscription = await self.registration.pushManager.subscribe(options);
    console.log(JSON.stringify(subscription));

    // make a request to the backend with the subscription
    const response = await saveSubscription(subscription);
    console.log(response);

  } catch(err){
    console.log('Error', err);
  }
});