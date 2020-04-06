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

let messageCount = 0;

subscriber.on("subscribe", function(channel, count) {
  console.log(count);
});

subscriber.on("message", function(channel, message) {
  messageCount += 1;

  console.log("Subscriber received message in channel '" + channel + "': " + message);

  let updatedMessage = JSON.parse(message);

  console.log(updatedMessage[2])

});

subscriber.subscribe("a channel");



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

  // code to run when user connects to :8080
  server.on('upgrade', (request, socket, head) => {

    // get the pathname that the individual is hitting
    const pathname = url.parse(request.url).pathname;

    // if the user is hitting a messages endpoint ie: (wss://localhost:8080/messages/anthony)
    var regexp1 = /\/messages\/(.*)/;

    if( pathname.match(regexp1) ){

      // username succeeds :8080/messages/__
      const username = pathname.match(regexp1)[1];

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

/** CALLBACK TO SEND A MESSAGE **/
function messageSocketCallback(ws){

  /** DECREMENT AMOUNT OF CONNECTED USERS ON CLOSE **/
  ws.on('close', function(code, reason){

    console.log(`closing socket: ${code}, ${reason}`);

    console.log(connectedUsers)

    console.log(connectedUsersAmount);

    connectedUsersAmount--;

    console.log(connectedUsersAmount)

    for(const user of connectedUsers){
      if(user.readyState == 1){
        // TODO: have to fix here for decrementing to work
        stringifyAndSend(user, { connectedUsersAmount });
      }
    }
  });

  function instantiateNewStreamingUserObject(streamingUser){
    messagesObject[streamingUser] = {};
    messagesObject[streamingUser].messages = [];
    messagesObject[streamingUser].connectedUsers = [];
    messagesObject[streamingUser].connectedUsersCount = 0;
  }

  /** everytime the server receives a message from the client **/
  ws.on('message', async function(_message){
    // publisher.publish("a channel", "another message");

    // console.log(_message);

    // parse stingified message sent from frontend
    message = JSON.parse(_message);

    // get username that sent the message
    var streamingUser = message.username;

    // code to run when a new user connects
    if(streamingUser && !messagesObject[streamingUser]){
      instantiateNewStreamingUserObject(streamingUser);
    }

    var message = message.message;

    // TODO: need to add a close message here
    // this is sent right before changing href location of client
    if(message == 'DISCONNECTING'){
      // TODO: get from redis, change the amount, save to redis, send publish message

      let amountOfConnectedUsers = await  redisClient.getAsync('connectedUsers');

      amountOfConnectedUsers = amountOfConnectedUsers -1;

      redisClient.setAsync('connectedUsers', amountOfConnectedUsers);

      publisher.publish('usernameStreaming', 'userAmountEvent');

      return'do something here';
    }

    // code to run when a new user connects
    if(message == 'CONNECTING'){

      // send all existing messages for streamer down to client
      // TODO: limit it to latest 200

      // TODO: get messages, and current watching viewer amount from redis
      // TODO: increment the viewer amount and save it
      // TODO: send to pub/sub that a user event has happened

      // TODO: replace with a pubsub publisher
      for(const message of messagesObject[streamingUser].messages){
        stringifyAndSend(ws, { message });
      }

      // increment amount of connected users
      messagesObject[streamingUser].connectedUsersCount++;

      // TODO: update redis, and then send publish thing

      console.log('new user connected to chat of: ' + streamingUser);

      // TODO: this can remain, maybe a refactor
      // add websocket connection to object
      messagesObject[streamingUser].connectedUsers.push(ws);

      // TODO: pull this out into a pubsub listener
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
    /** WHEN A NEW MESSAGE SENT **/
    if(message !== 'KEEP-ALIVE' && message !== 'undefined' ){

      // TODO: get from redis, add the message, save it, send message

      publisher.publish("a channel", JSON.stringify(messageThings));


      // save message to existing sent messages
      messagesObject[streamingUser].messages.push(message);

      // TODO: have to update via redis here ^

      // TODO: pull this out into a pubsub listener
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

