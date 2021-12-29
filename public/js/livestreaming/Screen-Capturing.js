// Last time updated at Sep 23, 2014, 08:32:23

// Latest file can be found here: https://cdn.webrtc-experiment.com/Screen-Capturing.js

// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// Documentation - https://github.com/muaz-khan/Chrome-Extensions/tree/master/Screen-Capturing.js
// Demo          - https://www.webrtc-experiment.com/Screen-Capturing/

// ___________________
// Screen-Capturing.js

// Source code: https://github.com/muaz-khan/Chrome-Extensions/tree/master/desktopCapture
// Google AppStore installation path: https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk

// This JavaScript file is aimed to explain steps needed to integrate above chrome extension
// in your own webpages

// Usage:
// getScreenConstraints(function(screen_constraints) {
//    navigator.webkitGetUserMedia({ video: screen_constraints }, onSuccess, onFailure );
// });

// First Step: Download the extension, modify "manifest.json" and publish to Google AppStore
//             https://github.com/muaz-khan/Chrome-Extensions/tree/master/desktopCapture#how-to-publish-yourself

// Second Step: Listen for postMessage handler
// postMessage is used to exchange "sourceId" between chrome extension and you webpage.
// though, there are tons other options as well, e.g. XHR-signaling, websockets, etc.
window.addEventListener('message', function(event){
  if(event.origin != window.location.origin){
    return;
  }

  onMessageCallback(event.data);
});

// and the function that handles received messages

function onMessageCallback(data){
  // "cancel" button is clicked
  if(data == 'PermissionDeniedError'){
    chromeMediaSource = 'PermissionDeniedError';
    if(screenCallback)return screenCallback('PermissionDeniedError');
    else throw new Error('PermissionDeniedError');
  }

  // extension notified his presence
  if(data == 'rtcmulticonnection-extension-loaded'){
    chromeMediaSource = 'desktop';
  }

  // extension shared temp sourceId
  if(data.sourceId && screenCallback){
    screenCallback(sourceId = data.sourceId);
  }
}
