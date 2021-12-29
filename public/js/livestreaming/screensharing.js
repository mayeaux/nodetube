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
