const videoExtensions = ['.mp4', '.MP4'];
const convertExtensions = ['.avi', '.flv', '.MOV', '.m4v', '.ogv', '.webm', '.wmv', '.mkv', '.mov', '.m2t', '.MTS', '.m2ts', '.MPG', '.AVI', '.mpg'];
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.JPG', '.PNG'];
const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

async function middleware(req, res, next){
  const path = req.path;

  var str = '/uploads/Manwe_Sulimo/cqDSPlg.png';
  var fileExtension = path.substr(path.indexOf('.'));

  const allFileExtensions = [].concat(videoExtensions, convertExtensions, imageExtensions, audioExtensions);

  const isAFile = allFileExtensions.includes(fileExtension);

  if(isAFile){
    res.status(404);
    res.send('miss');
  } else {
    next();
  }

}

// middleware();

module.exports = middleware;