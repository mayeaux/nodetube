// function shareScreen(){
//   var audioConstraints = {
//     audio: false,
//     video: true,
//   };
//   navigator.getUserMedia(audioConstraints, function(stream) {
//     initiateScreenSharing(stream);
//   }, function(error) {
//     console.error("Could not get audio stream! " + error);
//   });
// }

// getScreenId(function (error, sourceId, screen_constraints){
//
//   window.screen_constraints = screen_constraints;
//
//
//
//   console.log(sourceId);
//   console.log(screen_constraints);
// });

window.getVideoStream = function(){

  var audioConstraints = {
    audio: true,
    video: true
  };
  navigator.getUserMedia(audioConstraints, function(stream){

    console.log('got audio!');

    window.videoStream = stream;

    console.log(stream);

    window.streamType = 'video';

    swal('You\'re ready to start streaming, click Present');

  }, function(error){
    console.error('Could not get audio stream! ' + error);
  });

};

window.getAudioStream = function(){

  var audioConstraints = {
    audio: true,
    video: false
  };
  navigator.getUserMedia(audioConstraints, function(stream){

    console.log('got audio!');

    window.audioStream = stream;

    console.log(stream);

  }, function(error){
    console.error('Could not get audio stream! ' + error);
  });

};

window.getDesktopStream = function(){

  getScreenId(function(error, sourceId, screen_constraints){

    window.screen_constraints = screen_constraints;

    navigator.getUserMedia(screen_constraints, successCallbackVideo, function(err){
      console.log(err);
    });

    function successCallbackVideo(stream){
      window.desktopStream = stream;

      window.streamType = 'screenshare';

      swal('You\'re ready to start streaming, click Present');
    }

    console.log(screen_constraints);

  });

};

window.getScreenConstraints = function(screen, callback){

  console.log('running here!');

  getScreenId(function(error, sourceId, screen_constraints){

    console.log(error);

    window.screen_constraints = screen_constraints;

    console.log(screen_constraints);

    callback(null, screen_constraints);

  });

};

function initiateScreenSharing(audioStream){
  getScreenId(function(error, sourceId, screen_constraints){
    console.log('screen_constraints');
    console.log(screen_constraints);
    navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    navigator.getUserMedia(screen_constraints, function(stream){
      console.log(stream);

      var constraints = {
        audio: true,
        video: {
          frameRate: {
            min: 1, ideal: 15, max: 30
          },
          width: {
            min: 32, ideal: 50, max: 320
          },
          height: {
            min: 32, ideal: 50, max: 320
          }
        }
      };

      var localParticipant = new Participant(sessionId);
      participants[sessionId] = localParticipant;
      localVideo = document.getElementById('local_video');
      var video = localVideo;

      var options = {
        localVideo: video,
        videoStream: stream,
        mediaConstraints: constraints,
        onicecandidate: localParticipant.onIceCandidate.bind(localParticipant),
        sendSource: 'desktop'
      };

      localParticipant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error){
        if(error){
          return console.error(error);
        }

        // Set localVideo to new object if on IE/Safari
        localVideo = document.getElementById('local_video');

        // initial main video to local first
        localVideoCurrentId = sessionId;
        // localVideo.src = localParticipant.rtcPeer.localVideo.src;
        localVideo.muted = true;

        console.log('local participant id : ' + sessionId);
        this.generateOffer(localParticipant.offerToReceiveVideo.bind(localParticipant));
      });

    }, function(error){
      console.error(error);
    });
  });
}