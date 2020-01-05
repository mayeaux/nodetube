const path = require('path');

const videoExtensions = ['.mp4', '.MP4'];
const convertExtensions = ['.avi', '.flv', '.MOV', '.m4v', '.ogv', '.webm', '.wmv', '.mkv', '.mov', '.m2t', '.MTS', '.m2ts', '.MPG', '.AVI', '.mpg'];
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.JPG', '.PNG'];
const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.oga'];

function getMediaType(media){
  let fileType;

  // get extension name from file
  const extension = path.extname(media);

  // determine which extension the media matches
  const isAVideo = videoExtensions.includes(extension);
  const isAnAudio = audioExtensions.includes(extension);
  const isAnImage = imageExtensions.includes(extension);
  const isAConvert = convertExtensions.includes(extension);


  // determine what file type the media is
  if(isAVideo){
    fileType = 'video'
  } else if(isAnAudio){
    fileType = 'audio'
  } else if (isAnImage){
    fileType = 'image'
  }else if (isAConvert){
    fileType = 'convert'
  }  else {
    fileType = 'unknown'
  }

    return fileType
}

module.exports = getMediaType;

