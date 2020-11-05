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

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

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

async function main(){
  const uploads = await Upload.find({
    fileType: 'video'
  });

  for(const upload of uploads){
    const user = await User.findById(upload.uploader);
    const videoPath = `../uploads/${user.channelUrl}/${upload.uniqueTag}.mp4`;
    // console.log(`${videoPath}`);

    try {
      const response = await ffmpegHelper.ffprobePromise(videoPath);
      //  console.log(response);
      upload.ffprobeData = response;
      // save the ffprobe data
      await upload.save();
    } catch(err){
      console.log(err);
      continue;
    }
  }
  process.exit();
}

main();
