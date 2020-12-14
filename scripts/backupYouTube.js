/** Has to be run from project root directory **/
/** ie scripts/backupYouTube.js **/

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const FileType = require('file-type');
const webp = require('webp-converter');
const youtubedl = require('youtube-dl');
const spawn = require('child_process').spawn;

const redisClient = require('../config/redis');

const ffmpegHelper = require('../lib/uploading/ffmpeg');
const timeHelper = require('../lib/helpers/time');
const randomstring = require('randomstring');
const Upload = require('../models/index').Upload;
const User = require('../models/index').User;

const URLSearchParams = require('url').URLSearchParams;

const requestModule = require('request');
const request = Promise.promisifyAll(requestModule);
const _ = require('lodash');
const dotenv = require('dotenv');

const mkdirp = Promise.promisifyAll(require('mkdirp'));

var rp = require('request-promise');
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

const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

console.log(`ffmpeg path: ${ffmpegPath}`);

const youtubeBinaryFilePath = youtubedl.getYtdlBinary();

console.log(`youtube-dl binary path: ${youtubeBinaryFilePath}`);

// TODO: can pull this out, it's also used in updatedProcessingUpdatedAtTime.js
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

// actually do channel page
async function checkIfUploadedByTitleAndUploadUrl(uploaderId, title, uploadUrl){
  let alreadyUploaded = false;

  const alreadyExistsByTitle = await Upload.findOne({
    uploader: uploaderId,
    title,
    visibility: 'public',
    status: 'completed'
  });

  // console.log(alreadyExistsByTitle)

  const alreadyExistsByWebpageUrl = await Upload.findOne({
    uploader: uploaderId,
    'youTubeDLData.webpage_url': uploadUrl,
    visibility: 'public',
    status: 'completed'
  });

  // console.log(alreadyExistsByWebpageUrl)

  if(alreadyExistsByWebpageUrl || alreadyExistsByTitle){
    alreadyUploaded = true;
  }

  return alreadyUploaded;
}

/** download and save thumbnails locally **/
async function downloadAndSaveThumbnails(thumbnailUrl, uniqueTag, channelUrl){

  console.log('thumbnail url ' + thumbnailUrl);

  const containingFolder = `uploads/${channelUrl}`;

  const thumbnailDestination = `uploads/${channelUrl}/${uniqueTag}-thumbnail`;

  const thumbnail = await request.getAsync(thumbnailUrl, { encoding: 'binary' });

  // console.log(thumbnail);

  await mkdirp.mkdirpAsync(containingFolder);

  // save the thumbnail locally

  await fs.writeFileAsync(thumbnailDestination, thumbnail.body, 'binary');

  const fileTypeData = await FileType.fromFile(thumbnailDestination);

  const realExtension = fileTypeData.ext;

  const mime = fileTypeData.mime;

  let extension;

  if(realExtension == 'webp'){

    const newDestination = `uploads/${channelUrl}/${uniqueTag}.png`;

    // convert to png
    const result = await webp.dwebp(thumbnailDestination, newDestination, '-o');

    await fs.remove(thumbnailDestination);

    // TODO: have to delete thumbnail thing

    // console.log(result);
    console.log('ITS A WEBP');

    extension = 'png';
  } else {

    const newDestination = `uploads/${channelUrl}/${uniqueTag}.${realExtension}`;

    await fs.move(thumbnailDestination, newDestination);

    extension = realExtension;
  }

  // return the extension

  console.log('THUMBNAILS SAVED LOCALLY');

  console.log(uniqueTag);

  return extension;

}

function last(array){
  return array[array.length - 1];
}

// this is going to be a straight copy with no ability to add a custom title etc
// channel url to get the user and then match across titles
// youtube link
async function downloadVideoForUser(channelUrl, youtubeLink){
  console.log(channelUrl, youtubeLink);

  const isYouTubeVideo = youtubeLink.match('youtube.com/watch');

  if(isYouTubeVideo){
    console.log(isYouTubeVideo);

    console.log(youtubeLink);

    // youtubeLink = youtubeLink.split('?')[0]

    // clean up this url, a bit murky exactly what's happening
    var urlParts = youtubeLink.split('?');
    var params = new URLSearchParams(urlParts[1]);
    params.delete('list');
    params.delete('index');
    params.delete('t');
    youtubeLink = urlParts[0] + '?' + params.toString();
  }

  console.log(youtubeLink);

  // return

  try {

    let isBrighteonDownload = false;

    let options;
    if(isBrighteonDownload){
      options = ['-f bestvideo'];
    } else {
      options = ['-j', '--flat-playlist', '--dump-single-json'];
    }

    let info = await youtubeDlInfoAsync(youtubeLink, options);

    // TODO: add check for titles here

    // TODO: I don't really understand why this is happening
    // but this API is sending two objects which seem virtually identical

    // console.log(info.length);
    //
    // console.log('info length');
    //
    // console.log(info[0]);ObjectId("5e0922fd9a31cb0015a21f40")
    //
    // console.log('info end');

    /** PLAYLIST DOWNLOADING FUNCTIONALITY **/
    if(info.length > 2){
      console.log('playlist, returning as much');

      // TODO: add a for list here, check the title, if it whiffs, then download it per the function below

      info.reverse();

      for(const upload of info){
        const title = upload.title;
        const id = upload.id;

        const uploadUrl = 'https://www.youtube.com/watch?v=' + id;

        const user = await User.findOne({ channelUrl });

        const uploaderId = user._id; // <-- anthony (hardcode to tony)

        // const checkAgainstTitle = await checkTitle();

        const alreadyUploaded = await checkIfUploadedByTitleAndUploadUrl(uploaderId, title, uploadUrl);

        if(!alreadyUploaded){

          console.log('Still need to download ' + title);

          await Promise.delay(1000 * 8);

          // downloadVideoForUser(channelUrl, youtubeLink){

          // channelUrl to know who to save it for,
          await downloadVideoForUser(channelUrl, uploadUrl);
        } else {
          console.log('Already downloaded ' + title);

          await Promise.delay(1000 * 5);
        }

        //   need2know uploaderId
        //
        // if(stillGoodToDownload){
        //   const await downloadToInstance()
        // }
      }
      return'playlist';
    }

    // return

    // console.log(info);

    info = info[0];

    // console.log(info);

    delete info.formats;

    // console.log(info);
    //
    // console.log(info.thumbnails);

    const videoData = info;

    const height = videoData.height;

    const width = videoData.width;

    const aspectRatio = height / width;

    const title = videoData.title;

    // TODO: if it's there throw an error

    const webpageUrl = videoData.webpage_url;

    const fileSize = videoData.size;

    // var result = yourstr.replace(/^(?:00:)?0?/, '');

    // console.log(info);

    // console.log(info);
    //
    // console.log(info.thumbnails);

    if(info.thumbnails){
      var lastThumbnail = last(info.thumbnails);
    }

    const uploadingUser = await User.findOne({
      channelUrl
    });

    const uploaderId = uploadingUser._id;

    const alreadyUploaded = await checkIfUploadedByTitleAndUploadUrl(uploaderId, title, webpageUrl);

    if(alreadyUploaded){
      console.log('already uploaded');
      console.log(alreadyUploaded);

      return{
        uniqueTag: 'alreadyUploaded'
      };
    } else {
      console.log('not already uploaded');
    }

    console.log(uploadingUser._id + ' here');

    const uniqueTag = randomstring.generate(7);

    console.log(aspectRatio, title);

    // prepend some youtubedl stuff into the description
    let descriptionPrepend = `Originally uploaded to ${info.webpage_url}`;

    if(info.uploader){
      descriptionPrepend = descriptionPrepend + ` by ${info.uploader}`;
    }

    descriptionPrepend = descriptionPrepend + '\n\n';

    // TODO: bugfix if info.description is undefined
    let description;
    if(info.description){
      description = descriptionPrepend + info.description;
    } else {
      description = descriptionPrepend;
    }

    const youtubeDlUploadDate = info.upload_date;

    const dateToUseForCompletedProcessing = convertYouTubeDlDateToJsDate(youtubeDlUploadDate);

    // const description = descriptionPrepend + info.description;

    // instantiate upload
    // give it status and uploader and it will work
    let upload = new Upload({
      uploader: uploadingUser._id,
      title,
      description,
      fileType: 'video',
      fileExtension : '.mp4',
      uniqueTag,
      youTubeDLData: info,
      status: 'processing',
      rating: 'allAges',
      category: 'uncategorized',
      dimensions: {
        height,
        width,
        aspectRatio
      }

      /** note : this is for dev purposes **/
      // uploadServer: 'http://localhost:3000/uploads'
    });

    await upload.save();

    const user = await User.findOne({
      channelUrl
    });

    // save to user array
    user.uploads.push(upload._id);
    await user.save();

    redisClient.setAsync(`${uniqueTag}uploadProgress`, 'Your imported upload is beginning...');

    if(lastThumbnail){
      // turning off
      const lastThumbnailUrl = lastThumbnail.url;

      // // TODO: download thumbnail

      if(info.thumbnails){
        // // this comes back as an extension

        const downloadResponse = await downloadAndSaveThumbnails(lastThumbnailUrl, uniqueTag, channelUrl);

        console.log(downloadResponse + ' DOWNLOAD RESPONSE');

        upload.thumbnails.generated = `${uniqueTag}.${downloadResponse}`;

        /** Note: Using the converted date here so it will appear 'in chronological order' **/
        upload.processingCompletedAt = dateToUseForCompletedProcessing;

        await upload.save();
      }

    }

    // TODO: the way this directory works feels sketchy
    const directory = `uploads/${uploadingUser.channelUrl}/${uniqueTag}.mp4`;

    const fileInDirectory = directory;

    let commandLineArguments = [];

    // set the url for ytdl
    commandLineArguments.push(youtubeLink);

    // verbose output
    commandLineArguments.push('-v');

    // commandLineArguments.push('-f', 'bestvideo+bestaudio/best');

    commandLineArguments.push('--add-metadata');

    commandLineArguments.push('--ffmpeg-location');

    commandLineArguments.push(ffmpegPath);

    commandLineArguments.push('--no-mtime');

    commandLineArguments.push('--ignore-errors');

    // select download as audio or video

    // download as mp4 if it's youtube (tired of reconverting .flv files)
    const isYouTubeDownload = youtubeLink.match('youtube');

    const aConditional = true;

    if(aConditional){
      console.log('downloading from youtube');

      commandLineArguments.push('-f');

      commandLineArguments.push('best[tbr<4400][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][tbr<4400]/best[ext=mp4]');
    }

    // commandLineArguments.push('best');

    const fileExtension = '%(ext)s';

    const filePath = '.';

    // let saveToFolder = `${filePath}/%(title)s.${fileExtension}`;

    // save to videos directory
    commandLineArguments.push('-o', directory);

    // console.log(commandLineArguments);

    // deleted for now since it requires ffmpeg
    // download as audio if needed
    // if(downloadAsAudio){
    //   console.log('Download as audio');
    //   commandLineArguments.push('-x');
    // }

    // console.log(commandLineArguments);

    // create child execprocess with youtube-dl
    const ls = spawn(youtubeBinaryFilePath, commandLineArguments);

    // when youtube-dl gives more data
    ls.stdout.on('data', data => {

      data = data.toString();

      // dont include debug because it may include paths you don't want visible
      if(!data.match('debug')){
        // set the redis value with the value from youtube-dl's cli
        redisClient.setAsync(`${uniqueTag}uploadProgress`, data);

        console.log(`stdout: ${data}`);
      }
    });

    // when the process ends, mark it as completed
    ls.on('close', async(code) => {
      console.log(typeof code);

      console.log(`child process exited with code ${code}`);

      if(code == 0){
        console.log('successful upload');

        const response = await ffmpegHelper.ffprobePromise(fileInDirectory);

        upload.ffprobeData = response;

        upload.durationInSeconds = Math.round(response.format.duration);

        let bitrateInKbps = response.format.bit_rate / 1000;

        upload.bitrateInKbps = bitrateInKbps;

        upload.fileSize = response.format.size;

        upload.formattedDuration = timeHelper.secondsToFormattedTime(Math.round(response.format.duration));

        // TODO: add bitrate
        // in fact, I can't add bitrate here, because I'm not sure what format youtube-dl will select
        // I will have to ffprobe the file once it's done

        // honestly fileSize doesn't really work either so that also needs to be done with ffprobe

        // console.log(response);

        // add the last few things here

        // mark upload as completed
        upload.status = 'completed';
        upload.processingCompletedAt = dateToUseForCompletedProcessing;
        upload = await upload.save();

        // uploadedPath where the upload file location is
        // uniqueTag
        // upload
        // channelUrl

        if(!lastThumbnail){
          const response = await ffmpegHelper.takeAndUploadThumbnail(fileInDirectory, uniqueTag, upload, channelUrl);

          console.log(response);
        }

      }
    });

    return{
      uniqueTag
    };

    // console.log(info.formats);
    // console.log('Download started')
    // console.log('filename: ' + info._filename)
    // console.log('size: ' + info.size)

    // duration
    // height

    // video.pipe(fs.createWriteStream('myvideo.mp4'))

  } catch(err){

    console.log('importer function erroring');
    console.log(err);

    return{
      uniqueTag: 'error'
    };

    // console.log(err);
    //
    // console.log(err.stderr + ' stderr')
  }

}

function youtubeDlInfoAsync(url, options){
  return new Promise(function(resolve, reject){
    youtubedl.getInfo(url, options, function(err, data){
      if(err !== null) reject(err);
      else resolve(data);
    });
  });
}

// downloadVideoForUser('TonyHeller', 'https://www.youtube.com/c/TonyHeller/videos?view=0&sort=dd&shelf_id=1\n');
