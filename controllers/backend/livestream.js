const express = require('express');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');
const http = require('http');


const ws = require('ws');

const User = require('../../models/index').User;


const publisher = require('../../config/redis');

const Promise = require('bluebird');
var redis = require('redis');


let client2;
if(process.env.REDIS_URL){

  console.log(`CONNECTING TO REDIS_URL: ${process.env.REDIS_URL} \n`);
  client2 = redis.createClient(process.env.REDIS_URL); // creates a new redisClient

} else {
  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = process.env.REDIS_PORT || 6379;
  const redisPassword =  process.env.REDIS_PASSWORD || '';

  const options = {
    host: redisHost,
    port: redisPort
  };

  if(process.env.NODE_ENV == 'production'){
    options.password = redisPassword;
  }

  console.log(`CONNECTING TO REDIS, HOST: ${redisHost}, PORT: ${redisPort}\n`);

  client2 = redis.createClient(options); // creates a new redisClient

}

let subscriber = client2;

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const messageThings = [{
  username: 'thing',
  message: 'thing3'
}, {
  username: 'thing',
  message: 'thing3'
}, {
  username: 'thing',
  message: 'thing3'
}];


// subscriber.on("subscribe", function(channel, count) {
//   console.log(count);
// });


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

  console.log(uploadToken);

  const user = await User.findOne({ uploadToken });

  // console.log(user);

  if(user && user.plan == 'plus'){
    console.log('authentication passed');
    console.log('found user: ' + user.channelUrl);

    console.log(`Access the livestream at /live/${user.channelUrl}`)

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
let connectedUsers;
let connectedUsersAmount;
var messagesObject;

// TODO: have to fix this
if('true' == 'true')
{
  app = express();

  // default certs that came with I believe Kurento
  var options =
  {
    key:  fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
  };

  // TODO: if production do https otherwise do http

  // boot up express server to handle websocket connections
  server = http.createServer(options, app).listen(8443, function(){
    console.log('Websockets server started on port 8443');
  });

  // object which will hold message data and boot up servers
  webSockets = {};

  /** MESSAGES ENDPOINT **/

  existingMessages = [];
  connectedUsers = [];
  connectedUsersAmount = 0;

  // save already sent messages
  // TODO: need to do this in redis
  messagesObject = {};

  // code to run when user connects to :8443
  server.on('upgrade', (request, socket, head) => {

    // get the pathname that the individual is hitting
    const pathname = url.parse(request.url).pathname;

    // if the user is hitting a messages endpoint ie: (wss://localhost:8080/messages/anthony)
    var regexp1 = /\/messages\/(.*)/;

    if( pathname.match(regexp1) ){

      // username succeeds :8080/messages/__
      const username = pathname.match(regexp1)[1];

      // TODO: subscribe here
      console.log(username + ' username here');

      // instantiate the username for the in memory object if it doesn't exist yet
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

}

subscriber.on("message", function(channel, message) {

  console.log(message);

  const publishedMessage = JSON.parse(message);

  console.log(publishedMessage.eventType);

  // TODO: message should be an object in the form of
  // var fred = {
  //   eventType: 'userEvent', // or messageEvent
  //   message: 'hello'
  // };
  //


  // TODO: pass an object here where the streaming message and the message and stuff is passed

  console.log(channel, message);

  // loop through the
  for(const user of messagesObject[channel].connectedUsers){

    // console.log(user);

    // if the user is still connected
    if(user.readyState == 1){

      if(publishedMessage.eventType == 'publishedMessage'){
        stringifyAndSend(user, { message: publishedMessage.message });
      } else if(publishedMessage.eventType == 'userConnectedEvent'){
        stringifyAndSend(user, { connectedUsersAmount: publishedMessage.message });
      } else {
        console.log('UNRECOGNIZED EVENT THIS IS BAD')
      }
    }
  }


});


/** CALLBACK TO SEND A MESSAGE **/
function messageSocketCallback(ws){

  function instantiateNewStreamingUserObject(streamingUser){
    messagesObject[streamingUser] = {};
    messagesObject[streamingUser].messages = [];
    messagesObject[streamingUser].connectedUsers = [];
    messagesObject[streamingUser].connectedUsersCount = 0;
    // TODO: finish this
    subscriber.subscribe(streamingUser);
  }

  /** everytime the server receives a message from the client **/
  ws.on('message', async function(_message){
    // publisher.publish("a channel", "another message");

    // console.log(_message);

    // parse stingified message sent from frontend
    let message = JSON.parse(_message);

    // get username that sent the message
    var streamingUser = message.username;

    // console.log('streaming user ' + streamingUser);

    // code to run when a new user connects
    if(streamingUser && !messagesObject[streamingUser]){
      instantiateNewStreamingUserObject(streamingUser);
    }

    message = message.message;

    let amountOfConnectedUsers, redisMessages;

    if(streamingUser){
      // TODO: have to change this to user something like '$channelUrlConnectedUsers'
      amountOfConnectedUsers = await  publisher.getAsync('connectedUsers');

      redisMessages = await publisher.getAsync('messages');

      redisMessages = JSON.parse(redisMessages);

      if(!redisMessages){
        redisMessages = [];
      }

      console.log('amount connected');
      console.log(amountOfConnectedUsers);

      // if there's no amount of users yet, set it to 0
      if(!amountOfConnectedUsers){
        amountOfConnectedUsers = 0;
      } else {
        amountOfConnectedUsers = Number(amountOfConnectedUsers);
      }
    }

    /** working **/
    // this is sent right before changing href location of client
    if(message == 'DISCONNECTING'){

      console.log('DISCONNECTING!');

      amountOfConnectedUsers = amountOfConnectedUsers - 1;

      publisher.setAsync('connectedUsers', amountOfConnectedUsers);

      publisher.publish(streamingUser, JSON.stringify({
        eventType: 'userConnectedEvent',
        message: amountOfConnectedUsers
      }));

      return'do something here';
    }

    // code to run when a new user connects
    if(message == 'CONNECTING'){

      console.log('new user connected to chat of: ' + streamingUser);

      // send all existing messages for streamer down to client
      // TODO: limit it to latest 200

      // TODO: COMPILE AND SEND MESSAGES HERE



      for(const message of redisMessages){
        if(message){
          console.log('RUNNING!!');

          let event = {
            eventType: 'publishedMessage',
            message: message

          };

          console.log(event);

          publisher.publish(streamingUser, JSON.stringify(event));
        }
      }

      console.log(amountOfConnectedUsers + ' amount of things');

      amountOfConnectedUsers = amountOfConnectedUsers + 1;

      /** working **/

      publisher.setAsync('connectedUsers', amountOfConnectedUsers);

      publisher.publish(streamingUser, JSON.stringify({
        eventType: 'userConnectedEvent',
        message: amountOfConnectedUsers
      }));
      // add websocket connection to object
      messagesObject[streamingUser].connectedUsers.push(ws);

      console.log('connecting');
      return'do something here';
    }

    // sending keep alive as a hack to keep the socket open
    /** WHEN A NEW MESSAGE SENT **/
    if(message !== 'KEEP-ALIVE' && message !== 'undefined' ){

      console.log(message);

      let event = {
        eventType: 'publishedMessage',
        message: message

      };

      console.log(event);

      publisher.publish(streamingUser, JSON.stringify(event));






      redisMessages.push(message);

      publisher.setAsync('messages', JSON.stringify(redisMessages));


      // TODO: add to message array, JSON.stringify, save

      // TODO: get from redis, add the message, save it, send message

      // publisher.publish(streamingUser, JSON.stringify(messageThings));

      // TODO: update here

      // save message to existing sent messages
      messagesObject[streamingUser].messages.push(message);

      // TODO: update and save the messages object, push an update reminder thing to the frontend

    }
  });
}

// stringifies message objects
function stringifyAndSend(webSocketConnection, objectToSend){
  webSocketConnection.send( JSON.stringify( objectToSend ) );
}


//
// subscriber.on("message", function(channel, message) {
//   console.log("Subscriber received message in channel '" + channel + "': " + message);
//
//
//   console.log(channel);
//   console.log(message);
//
// });
