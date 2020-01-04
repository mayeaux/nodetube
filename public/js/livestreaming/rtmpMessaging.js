
/** MESSAGING FUNCTIONALITY**/

var pathName = window.location.pathname;

var regexp = /\/live\/(.*)/;

var username = pathName.match(regexp)[1];

var env = '#{env || '+production+'}';

var websocketUrl;
var messageUrl;

// var webSocketUrl = 'wss://' + location.host + '/one2many';

if(env == 'production'){
  webSocketUrl = 'wss://' + 'live.pewtube.com' + '/stream/' + username;
  messageUrl = 'wss://' + 'live.pewtube.com' + '/messages/' + username;
} else {
  webSocketUrl = 'wss://' + 'localhost:8080' + '/stream/' + username;
  messageUrl = 'wss://' + 'localhost:8080' + '/messages/' + username;
}

var messageUrl = 'ws://' + location.host + '/messages';

messageUrl = 'wss://' + 'localhost:8080' + '/messages/' + username;

console.log(messageUrl);

var messageSocket = new WebSocket(messageUrl);

var onUserConnection = {
  username: username,
  message: 'CONNECTING'
};

messageSocket.onopen = function(event){
  messageSocket.send(JSON.stringify(onUserConnection));
};

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(string){
  return String(string).replace(/[&<>"'`=\/]/g, function(s){
    return entityMap[s];
  });
}

var usernamePicked = false;

// var usernamePicked = true;
var messagingUsername;

$( document ).ready(function(){

  // username selection functionality
  $('.message-text').on('focus', function(){

    if(usernamePicked == false){
      swal({
        title: 'Pick Username',
        text: 'Please write your username below',
        type: 'input',
        showCancelButton: true,
        closeOnConfirm: false,
        animation: 'slide-from-top',
        inputPlaceholder: 'Username'
      },
      function(inputValue){
        if(inputValue === false)return false;

        if(inputValue === ''){
          swal.showInputError('You need to write something!');
          return false;
        }

        messagingUsername = inputValue;
        usernamePicked = true;

        swal({
          title: 'Nice',
          text: 'You selected the username: ' + inputValue,
          type: 'success'
        },

        function(){
          setTimeout(function(){
            $('.message-text').focus();
          }, 500);

        });

      });

    }

  });

  // send message via websocket
  function sendChatMessage(){
    var messageText = $('.message-text').val();

    if(messageText == ''){
      return;
    }

    messageText = messagingUsername + ': ' + messageText;

    // make sure this username is the username of the streamer
    var onSendMessage = {
      username: username,
      message: messageText
    };

    messageSocket.send(JSON.stringify(onSendMessage));

    messageText = $('.message-text').val('');
  }

  // when send message button clicked
  $('.send-text').on('click', function(e){
    e.preventDefault();

    sendChatMessage();
  });

  // when enter button clicked
  $(document).keypress(function(e){
    if(e.which == 13){
      sendChatMessage();
    }
  });
});

var connectedUsersAmount = 0;

// receive connected user amounts and new messages
messageSocket.onmessage = function(message){

  data = JSON.parse(message.data);

  console.log(data);

  // if message, prepend it to messages list
  if(data.message && data.message !== 'undefined: undefined'){

    var escapedMessage = escapeHtml(data.message);

    $('.message-list').prepend( '<li>' + escapedMessage + '</li>' ).html();

  }

  // if its to do with connected users, append
  if(data.connectedUsersAmount){
    connectedUsersAmount = data.connectedUsersAmount;

    $('.userAmount').text('Users In Room: ' + connectedUsersAmount);

    // console.log(connectedUsersAmount);
  }

};

// close socket on page reload
window.onbeforeunload = function(event)
{
  console.log('closing!');

  var onUserDisconnection = {
    username: username,
    message: 'DISCONNECTING'
  };

  messageSocket.send(JSON.stringify(onUserDisconnection));
  messageSocket.close();
  ws.close();
};

// keep socket open for messages
setInterval(function(){

  messageSocket.send(JSON.stringify({ message: 'KEEP-ALIVE'}));

}, 1000 * 10);
