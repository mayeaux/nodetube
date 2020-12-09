// This is a helper for adding ffmpeg data to the Upload model for
// old uploads.
// In order to us it, symlink your uploads directory in ../ as well
// as .env.settings and .env.private files, then just run
// `node ./migrate_ffmpeg.js` from within this directory
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ffmpegHelper = require('../../lib/uploading/ffmpeg');

process.on('unhandledRejection', console.log);

dotenv.load({ path: '../.env.private' });
dotenv.load({ path: '../.env.settings' });

const mongoUri = process.env.MONGODB_URI;

console.log('Connected to ' + mongoUri);

mongoose.Promise = global.Promise;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect(mongoUri, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;

// TODO: a good candidate for automated testing
function convertYouTubeDlDateToJsDate(youtubeDlDate){
  var dateString  = youtubeDlDate;

  // console.log(dateString)
  var year        = dateString.substring(0,4);
  var month       = dateString.substring(4,6);
  var day         = dateString.substring(6,8);

  var date        = new Date(year, month-1, day);

  // console.log(date);

  return date;

}

async function main(){
  const channelUrl = 'TonyHeller';
  const user = await User.findOne({
    channelUrl
  });

  // uploader_id
  const uploads = await Upload.find({
    uploader: user._id,
    'youTubeDLData.uploader_id' : 'TonyHeller1'
  });

  console.log(uploads);
  console.log(uploads.length);

  for(const upload of uploads){

    var dateString  = upload.youTubeDLData.upload_date;

    var convertedDate = convertYouTubeDlDateToJsDate(dateString);

    upload.processingCompletedAt = convertedDate;

    await upload.save();

  }
  process.exit();
}

main();
