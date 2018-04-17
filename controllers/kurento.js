// const Promise = require('bluebird')
// const express = require('express');
// const http = require('http');
// const url = require('url');
// const WebSocket = require('ws');
// const fs = require('fs');
// const https = require('https');
// const ws = require('ws');
// const path = require('path');
// const minimist = require('minimist');
// const kurento = Promise.promisifyAll(require('kurento-client'));
//
// const User = require('../models').User;
//
// process.on('uncaughtException', (err) => {
//   console.log(`Uncaught Exception: `, err);
//   console.log(err.stack);
// });
//
// process.on('unhandledRejection', (err) => {
//   console.log(`Unhandled Rejection: `, err);
//   console.log(err.stack);
// });
//
//
//
// var options =
//   {
//     key:  fs.readFileSync('keys/server.key'),
//     cert: fs.readFileSync('keys/server.crt')
//   };
//
// const app = express();
//
// // const server = http.createServer(app).listen(8080, function listening() {
// //   console.log('Listening on %d', server.address().port);
// // });
//
// var server = https.createServer(options, app).listen(8080, function() {
//   console.log('Websockets server started');
// });
//
// let webSockets = {};
//
// server.on('upgrade', (request, socket, head) => {
//
//   // console.log(request);
//
//   const pathname = url.parse(request.url).pathname;
//
//   var regexp = /\/stream\/(.*)/;
//
//   var regexp1 = /\/messages\/(.*)/;
//
//
//
//   // if regexp match stream, then load a guy up
//   if (pathname.match(regexp)) {
//
//     const username = pathname.match(regexp)[1];
//
//     if(!webSockets[username]){
//       webSockets[username] = {};
//     }
//
//     if(!webSockets[username].stream){
//       webSockets[username].stream = new WebSocket.Server({ noServer: true });
//
//       // oldstream websocket connections
//       webSockets[username].stream.on('connection', webSocketConnectCallback);
//
//     }
//
//     webSockets[username].stream.handleUpgrade(request, socket, head, (ws) => {
//
//       console.log('Loader hit for stream');
//
//       webSockets[username].stream.emit('connection', ws);
//     });
//
//     // if regexp match message, then load a guy up
//   } else if ( pathname.match(regexp1) ) {
//
//     const username = pathname.match(regexp1)[1];
//
//     if(!webSockets[username]){
//       webSockets[username] = {};
//     }
//
//     if(!webSockets[username].messages){
//       webSockets[username].messages = new WebSocket.Server({ noServer: true });
//
//       // oldstream websocket connections
//       webSockets[username].messages.on('connection', messageSocketCallback);
//
//     }
//
//     webSockets[username].messages.handleUpgrade(request, socket, head, (ws) => {
//
//       console.log('Loader hit for messages');
//
//       webSockets[username].messages.emit('connection', ws);
//     });
//
//
//
//   } else {
//     socket.destroy();
//   }
// });
//
// /*
//  * Definition of global variables.
//  */
//
// // track id of websocket connections
// var idCounter = 0;
//
// // handles ice candidates
// var candidatesQueue = {};
//
// const ws_uri = 'ws://144.217.180.135:8888/kurento';
//
// var kurentoClient = null;
//
// // have to set multiple presenters, not a globally referenced one
// // var presenter = null;
//
// var noPresenterMessage = 'No active presenter. Try again later...';
//
// function nextUniqueId() {
//   idCounter++;
//   return idCounter.toString();
// }
//
// let viewers = {};
//
// let idToPresenterName = {};
//
// function webSocketConnectCallback(ws){
//
//   // increment id and turn it into a string
//   var sessionId = nextUniqueId();
//   console.log('Connection received with sessionId ' + sessionId);
//
//   ws.on('error', function(error) {
//     console.log('Connection ' + sessionId + ' error');
//     stop(sessionId, presenterName);
//   });
//
//   ws.on('close', function() {
//
//     var presenterName = idToPresenterName[sessionId];
//
//     if(presenterName){
//       console.log('presenter name');
//       console.log(presenterName)
//     }
//
//     stop(sessionId, presenterName);
//   });
//
//   ws.on('message', function(_message) {
//
//     let message = JSON.parse(_message);
//
//     const presenterName = message.presenter;
//
//     if(presenterName){
//       idToPresenterName[sessionId] = presenterName;
//     }
//
//     // console.log('Connection ' + sessionId + ' received message ', message);
//
//     switch (message.id) {
//
//       // try to start a new presentation
//       case 'presenter':
//         startPresenter(sessionId, presenterName, ws, message.sdpOffer, function(error, sdpAnswer) {
//           if (error) {
//             return ws.send(JSON.stringify({
//               id : 'presenterResponse',
//               response : 'rejected',
//               message : error
//             }));
//           }
//           ws.send(JSON.stringify({
//             id : 'presenterResponse',
//             response : 'accepted',
//             sdpAnswer : sdpAnswer
//           }));
//         });
//         break;
//
//       // try to start a new view for user
//       case 'viewer':
//         startViewer(sessionId, presenterName, ws, message.sdpOffer, function(error, sdpAnswer) {
//           if (error) {
//             return ws.send(JSON.stringify({
//               id : 'viewerResponse',
//               response : 'rejected',
//               message : error
//             }));
//           }
//
//           ws.send(JSON.stringify({
//             id : 'viewerResponse',
//             response : 'accepted',
//             sdpAnswer : sdpAnswer
//           }));
//         });
//         break;
//
//       case 'stop':
//         stop(sessionId, presenterName);
//         break;
//
//       case 'onIceCandidate':
//         onIceCandidate(sessionId, presenterName, message.candidate);
//         break;
//
//       default:
//         ws.send(JSON.stringify({
//           id : 'error',
//           message : 'Invalid message ' + message
//         }));
//         break;
//     }
//   });
// }
//
// // // newstream websocket connections
// // newStream.on('connection', webSocketConnectCallback);
//
// /*
//  * Definition of functions
//  */
//
// // Instantiate a kurento client with the given server websocket url, attach it to global kurentoClient variable
// function getKurentoClient(callback) {
//   if (kurentoClient !== null) {
//     return callback(null, kurentoClient);
//   }
//
//   kurento(ws_uri, function(error, _kurentoClient) {
//     if (error) {
//       console.log("Could not find media server at address " + argv.ws_uri);
//       return callback("Could not find media server at address" + argv.ws_uri
//         + ". Exiting with error " + error);
//     }
//
//     kurentoClient = _kurentoClient;
//     callback(null, kurentoClient);
//   });
// }
//
// let presenter = null;
//
// let presenters = {};
//
//
//
// setInterval(function(){
//   console.log(viewers);
//   console.log(presenters);
// }, 1000 * 60);
//
// function startPresenter(sessionId, presenterName, ws, sdpOffer, callback) {
//   // console.log(ws);
//
//   // what is this doing?
//   clearCandidatesQueue(sessionId);
//
//   // console.log(presenters[presenterName]);
//   // console.log(presenters[presenterName] == undefined);
//
//
//   // stop stream if presenter already exists
//   if (presenters[presenterName] !== undefined) {
//
//     if(presenters[presenterName].pipeline !== null){
//       console.log('already exists');
//       console.log(presenters[presenterName])
//
//       stop(sessionId, presenterName);
//       return callback("Another user is currently acting as presenter. Try again later ...");
//     }
//   }
//
//   // add users to global presenters object
//   presenters[presenterName] = {
//     id : sessionId,
//     pipeline : null,
//     webRtcEndpoint : null
//   };
//
//   console.log('just added presenters');
//   console.log(presenters);
//
//   // instantiate viewers array for presenter
//   viewers[presenterName] = [];
//
//   // get instance of kurento client
//   getKurentoClient(function(error, kurentoClient) {
//
//     // console.log(kurentoClient);
//
//     if (error) {
//       stop(sessionId, presenterName);
//       return callback(error);
//     }
//
//     if (presenters[presenterName] === undefined) {
//       stop(sessionId, presenterName);
//       return callback(noPresenterMessage);
//     }
//
//     kurentoClient.create('MediaPipeline', function(error, pipeline) {
//
//       // console.log(pipeline);
//
//       if (error) {
//         stop(sessionId, presenterName);
//         return callback(error);
//       }
//
//       if (presenters[presenterName] === undefined) {
//         stop(sessionId, presenterName);
//         return callback(noPresenterMessage);
//       }
//
//       presenters[presenterName].pipeline = pipeline;
//
//       const file_uri = 'file:///tmp/recorder_demo1.webm';
//
//       var elements = [{type: 'RecorderEndpoint', params: {uri : file_uri}}, {type: 'WebRtcEndpoint', params: {}}];
//
//       pipeline.create(elements, function(error, elements) {
//
//         var webRtcEndpoint = elements[1];
//
//         var recorder = elements[0];
//
//         webRtcEndpoint.connect(recorder);
//
//         // console.log(recorder);
//
//         recorder.record(function(error) {
//           if (error){
//             console.log('error');
//             console.log(error);
//           }
//
//           console.log("starting recording");
//
//           setTimeout(function(){
//
//             recorder.stop();
//
//             console.log('stopping recording');
//
//             recorder.release();
//
//             // pipeline.release();
//
//           }, 1000 * 15)
//
//         });
//
//         if (error) {
//           stop(sessionId, presenterName);
//           return callback(error);
//         }
//
//         if (presenters[presenterName] === undefined) {
//           stop(sessionId, presenterName);
//           return callback(noPresenterMessage);
//         }
//
//         presenters[presenterName].webRtcEndpoint = webRtcEndpoint;
//
//         console.log('updated presenters');
//         console.log(presenters);
//
//         // add back all the old ice candidates?
//         if (candidatesQueue[sessionId]) {
//           while(candidatesQueue[sessionId].length) {
//             var candidate = candidatesQueue[sessionId].shift();
//             webRtcEndpoint.addIceCandidate(candidate);
//           }
//         }
//
//         webRtcEndpoint.on('OnIceCandidate', function(event) {
//           var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
//           ws.send(JSON.stringify({
//             id : 'iceCandidate',
//             candidate : candidate
//           }));
//         });
//
//         webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
//           if (error) {
//             stop(sessionId, presenterName);
//             return callback(error);
//           }
//
//           if (presenters[presenterName] === undefined) {
//             stop(sessionId, presenterName);
//             return callback(noPresenterMessage);
//           }
//
//           callback(null, sdpAnswer);
//         });
//
//         webRtcEndpoint.gatherCandidates(function(error) {
//           if (error) {
//             stop(sessionId, presenterName);
//             return callback(error);
//           }
//         });
//       });
//     });
//   });
// }
//
// function startViewer(sessionId, presenterName, ws, sdpOffer, callback) {
//   clearCandidatesQueue(sessionId);
//
//   // console.log('presenters!')
//   console.log(presenters);
//   // console.log(presenterName);
//
//   if (presenters[presenterName] === undefined) {
//     console.log('nothing here');
//
//     stop(sessionId, presenterName);
//     return callback(noPresenterMessage);
//   }
//
//   presenters[presenterName].pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
//     if (error) {
//       stop(sessionId, presenterName);
//       return callback(error);
//     }
//     viewers[presenterName][sessionId] = {
//       "webRtcEndpoint" : webRtcEndpoint,
//       "ws" : ws
//     };
//
//     if (presenters[presenterName] === undefined) {
//       stop(sessionId, presenterName);
//       return callback(noPresenterMessage);
//     }
//
//     // what is this code doing?
//     if (candidatesQueue[sessionId]) {
//       while(candidatesQueue[sessionId].length) {
//         var candidate = candidatesQueue[sessionId].shift();
//         webRtcEndpoint.addIceCandidate(candidate);
//       }
//     }
//
//     webRtcEndpoint.on('OnIceCandidate', function(event) {
//       var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
//       ws.send(JSON.stringify({
//         id : 'iceCandidate',
//         candidate : candidate
//       }));
//     });
//
//     webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
//       if (error) {
//         stop(sessionId, presenterName);
//         return callback(error);
//       }
//       if (presenters[presenterName] === undefined) {
//         stop(sessionId, presenterName);
//         return callback(noPresenterMessage);
//       }
//
//       presenters[presenterName].webRtcEndpoint.connect(webRtcEndpoint, function(error) {
//         if (error) {
//           stop(sessionId, presenterName);
//           return callback(error);
//         }
//         if (presenters[presenterName] === undefined) {
//           stop(sessionId, presenterName);
//           return callback(noPresenterMessage);
//         }
//
//         callback(null, sdpAnswer);
//         webRtcEndpoint.gatherCandidates(function(error) {
//           if (error) {
//             stop(sessionId, presenterName);
//             return callback(error);
//           }
//         });
//       });
//     });
//   });
// }
//
// function clearCandidatesQueue(sessionId) {
//   if (candidatesQueue[sessionId]) {
//     delete candidatesQueue[sessionId];
//   }
// }
//
// // TODO: have to fix, if you want to
// function stop(sessionId, presenterName) {
//
//   console.log('running stop');
//
//   // if the presenter is stopping, stop all viewers and release pipeline
//   if (presenters[presenterName] !== undefined && presenters[presenterName].id == sessionId) {
//
//     console.log('stopping stream here!');
//
//     for (var i in viewers) {
//       var viewer = viewers[i];
//       if (viewer.ws) {
//         viewer.ws.send(JSON.stringify({
//           id : 'stopCommunication'
//         }));
//       }
//     }
//     presenters[presenterName].pipeline.release();
//     presenters[presenterName] = undefined;
//     viewers[presenterName] = [];
//
//   }
//
//   else if (viewers[presenterName] && viewers[presenterName][sessionId]) {
//     viewers[presenterName][sessionId].webRtcEndpoint.release();
//     delete viewers[presenterName][sessionId];
//   }
//
//   else {
//     console.log(sessionId);
//     console.log(presenterName);
//     console.log(viewers);
//     console.log(presenters);
//   }
//
//   clearCandidatesQueue(sessionId);
//
//   if (viewers[presenterName] && viewers[presenterName].length < 1 && !presenters[presenterName] && kurentoClient) {
//     console.log('Closing kurento client');
//     // kurentoClient.close();
//     kurentoClient = null;
//   }
// }
//
//
//
//
// /**
//  * GET /
//  * Get staging page.
//  */
// exports.getStaging = (req, res) => {
//   if(process.env.LIVESTREAM_APP !== 'true' && process.env.NODE_ENV == 'production'){
//     const livestreamApp = 'https://live.pewtube.com';
//
//     return res.redirect(livestreamApp + req.path);
//   }
//
//   var regexp = /\/user\/(.*)\/live/;
//
//   const username = req.url.match(regexp)[1];
//
//   if(!req.user){
//     return res.redirect('/login');
//   }
//
//   if(req.user.channelUrl !== username){
//     return res.send("sorry you're not authorized")
//   }
//
//   if(req.user.plan !== 'plus'){
//     req.flash('errors', { msg: 'Please purchase Plus to access livestreaming' });
//     return res.redirect('/account')
//   }
//
//   console.log(username);
//
//   res.render('livestream/staging', {
//     title: 'Livestream Staging',
//     env: process.env.NODE_ENV
//   });
// };
//
//
//
//
//
//
// function onIceCandidate(sessionId, presenterName, _candidate) {
//   var candidate = kurento.getComplexType('IceCandidate')(_candidate);
//
//   if (presenters[presenterName] && presenters[presenterName].id === sessionId && presenters[presenterName].webRtcEndpoint) {
//     // console.info('Sending presenter candidate');
//     presenters[presenterName].webRtcEndpoint.addIceCandidate(candidate);
//   }
//   else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
//     // console.info('Sending viewer candidate');
//     viewers[presenterName][sessionId].webRtcEndpoint.addIceCandidate(candidate);
//   }
//   else {
//     // console.info('Queueing candidate');
//     if (!candidatesQueue[sessionId]) {
//       candidatesQueue[sessionId] = [];
//     }
//     candidatesQueue[sessionId].push(candidate);
//   }
// }