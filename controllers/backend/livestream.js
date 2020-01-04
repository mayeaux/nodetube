const Promise = require('bluebird');
const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');
const ws = require('ws');
const path = require('path');
const minimist = require('minimist');

const User = require('../../models/index').User;

// process.on('uncaughtException', (err) => {
//   console.log(`Uncaught Exception: `, err);
//   console.log(err.stack);
// });
//
// process.on('unhandledRejection', (err) => {
//   console.log(`Unhandled Rejection: `, err);
//   console.log(err.stack);
// });

/**
 * POST livestream/on-live-done
 * Endpoint that nginx-rtmp hits after the stream is finished
 */
exports.onLiveDone = (req, res) => {

  console.log(req.body);

  return res.send('work');

  const user = req.params.user;

  console.log(user);

  res.render('livestream/rtmp', {
    user,
    title: 'Livestream ',
    env: process.env.NODE_ENV
  });
};

/**
 * POST livestream/on-live-auth
 * Endpoint that nginx-rtmp hits to complete authentication
 */
exports.onLiveAuth = async(req, res) => {

  console.log(req.body);

  const uploadToken = req.body.key;

  const user = await User.findOne({ uploadToken });

  if(user && user.plan == 'plus'){
    console.log('authentication passed');
    console.log('found user: ' + user.channelUrl);

    return res.send('working');
  } else {

    console.log('having to blow up');

    if(user){
      console.log('user ' + user.channelUrl);
    }

    return res.status(500).send('Something broke!');
  }

};

var app;
var server;
let webSockets;
let existingMessages;
let connectedUsers;
let connectedUsersAmount;
var messagesObject;

if(process.env.LIVESTREAM_APP == 'true')
{
  app = express();

  // default certs that came with I believe Kurento
  var options =
  {
    key:  fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
  };

  // boot up express server to handle websocket connections
  server = https.createServer(options, app).listen(8080, function(){
    console.log('Websockets server started on port 8080');
  });

  // object which will hold message data and boot up servers
  webSockets = {};

  // code to run when user connects to :8080
  server.on('upgrade', (request, socket, head) => {

    // get the pathname that the individual is hitting
    const pathname = url.parse(request.url).pathname;

    // if the user is hitting a messages endpoint ie: (wss://localhost:8080/messages/anthony)
    var regexp1 = /\/messages\/(.*)/;

    if( pathname.match(regexp1) ){

      // username succeeds :8080/messages/__
      const username = pathname.match(regexp1)[1];

      // instantiate the username for the websockets object if it doesn't exist yet
      if(!webSockets[username]){
        webSockets[username] = {};
      }

      // setup a new websocket server for the messages if one doesn't exist already
      if(!webSockets[username].messages){
        webSockets[username].messages = new WebSocket.Server({ noServer: true });

        // when someone connects to this websocket server, run them through callback
        webSockets[username].messages.on('connection', messageSocketCallback);

      }
      // code to run when a new connection is made
      webSockets[username].messages.handleUpgrade(request, socket, head, (ws) => {

        console.log('Loader hit for messages');

        webSockets[username].messages.emit('connection', ws);
      });

    } else {
      socket.destroy();
    }
  });

  /** MESSAGES ENDPOINT **/

  existingMessages = [];
  connectedUsers = [];
  connectedUsersAmount = 2;

  // save already sent messages
  messagesObject = {};

  /** DECREMENT AMOUNT OF CONNECTED USERS ON CLOSE **/
  ws.on('close', function(code, reason){

    console.log('closing socket');

    connectedUsersAmount--;

    for(const user of connectedUsers){
      if(user.readyState == 1){
        stringifyAndSend(user, { connectedUsersAmount });
      }
    }
  });
}

/** CALLBACK TO SEND A MESSAGE **/
function messageSocketCallback(ws){

  ws.on('message', function(_message){

    // console.log(_message);

    // parse stingified message sent from frontend
    message = JSON.parse(_message);

    // get username that sent the message
    var streamingUser = message.username;

    // code to run when a new user connects
    if(streamingUser && !messagesObject[streamingUser]){
      messagesObject[streamingUser] = {};
      messagesObject[streamingUser].messages = [];
      messagesObject[streamingUser].connectedUsers = [];
      messagesObject[streamingUser].connectedUsersCount = 2;
    }

    var message = message.message;

    // TODO: need to add a close message here
    // this is sent right before changing href location of client
    if(message == 'DISCONNECTING'){

      messagesObject[streamingUser].connectedUsersCount--;

      return'do something here';
    }

    // code to run when a new user connects
    if(message == 'CONNECTING'){

      // send all existing messages
      // TODO: limit it to latest 200
      for(const message of messagesObject[streamingUser].messages){
        stringifyAndSend(ws, { message });
      }

      // increment amount of connected users
      messagesObject[streamingUser].connectedUsersCount++;

      console.log('new user connected to chat of: ' + streamingUser);

      // add websocket connection to object
      messagesObject[streamingUser].connectedUsers.push(ws);

      // send new message to already connected users
      for(const user of messagesObject[streamingUser].connectedUsers){

        // if the user is still connected
        if(user.readyState == 1){

          // update how many users are connected
          stringifyAndSend(user, { connectedUsersAmount: messagesObject[streamingUser].connectedUsersCount });
        }
      }

      console.log('connecting');
      return'do something here';
    }

    // sending keep alive as a hack to keep the socket open
    // this conditional means that a new message has been sent
    if(message !== 'KEEP-ALIVE' && message !== 'undefined' ){

      // save message to existing sent messages
      messagesObject[streamingUser].messages.push(message);

      // push new message down to all still connected clients
      for(const user of messagesObject[streamingUser].connectedUsers){

        // check if connection is still running
        if(user.readyState == 1){

          stringifyAndSend(user, { message });
        }
      }
    }
  });
}

// stringifies message objects
function stringifyAndSend(webSocketConnection, objectToSend){
  webSocketConnection.send( JSON.stringify( objectToSend ) );
}

