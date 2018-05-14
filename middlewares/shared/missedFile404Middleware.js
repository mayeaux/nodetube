const videoExtensions = ['.mp4', '.MP4'];
const convertExtensions = ['.avi', '.flv', '.MOV', '.m4v', '.ogv', '.webm', '.wmv', '.mkv', '.mov', '.m2t', '.MTS', '.m2ts', '.MPG', '.AVI', '.mpg'];
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.JPG', '.PNG'];
const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

async function middleware(req, res, next){
  // const path = req.path;

  var str = "/uploads/Manwe_Sulimo/cqDSPlg.png";
  var afterPeriod = str.substr(str.indexOf("."));

  // TODO:
  // combine all arrays
  // do a contain check
  // load up the middleware properly
  // res.send a 404 if it's a hit

  console.log(afterPeriod)


}

middleware();