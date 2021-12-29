/** Has to be run from project root directory **/
/** ie scripts/backupYouTube.js **/

const youtubedl = require('youtube-dl');
const dotenv = require('dotenv');

const mongoose = require('mongoose');

process.on('unhandledRejection', console.log);

dotenv.load({ path: '.env.private' });
dotenv.load({ path: '.env.settings' });

const mongoUri = process.env.MONGODB_URI;

console.log('Connected to ' + mongoUri);

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.Promise = global.Promise;

mongoose.connect(mongoUri, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useNewUrlParser: true
});

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

// turn off for now, still need that file
// const downloader = require('./downloadBinary');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

console.log(`ffmpeg path: ${ffmpegPath}`);

const youtubeBinaryFilePath = youtubedl.getYtdlBinary();

console.log(`youtube-dl binary path: ${youtubeBinaryFilePath}`);
