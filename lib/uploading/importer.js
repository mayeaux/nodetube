const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const FileType = require('file-type');
const webp = require('webp-converter');


const youtubedl = require('youtube-dl');
const randomstring = require('randomstring');
const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;



const requestModule = require('request');
const request = Promise.promisifyAll(requestModule);
const _ = require('lodash');
const dotenv = require('dotenv');

const mkdirp = Promise.promisifyAll(require('mkdirp'));


const mongoose = require('mongoose');

const databasePath = process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/nodetubeaug18'
console.log('DATABASE: ' + databasePath);

/** download and save thumbnails locally **/
async function downloadAndSaveThumbnails(thumbnailUrl, uniqueTag, channelUrl, extension){

  const containingFolder = `uploads/${channelUrl}`;

  const thumbnailDestination = `uploads/${channelUrl}/${uniqueTag}-custom.${extension}`;

  const thumbnail = await request.getAsync(thumbnailUrl, { encoding: 'binary' });

  await mkdirp.mkdirpAsync(containingFolder);

  // save the thumbnail locally

  await fs.writeFileAsync(thumbnailDestination, thumbnail.body, 'binary');

  const fileTypeData = await FileType.fromFile(thumbnailDestination);

  const realExtension = fileTypeData.ext;

  const mime = fileTypeData.mime;

  if(realExtension == 'webp'){

    const newDestination = `uploads/${channelUrl}/${uniqueTag}-custom.png`;

    const result = await webp.dwebp(thumbnailDestination, newDestination, "-o");

    console.log(result);
    console.log('ITS A WEBP')
  }

  // TODO: test : is this webp?

  // if so, have to convert that file to png via that libary
  // const result = webp.dwebp(originalFile, convertedFile, "-o");

  // then return the path of that file as this function

  // also pass that extension

  // return the extension

  console.log(`THUMBNAILS SAVED LOCALLY`);

  console.log(uniqueTag)

  return true

};


// /**
//  * Connect to MongoDB.
//  */
// mongoose.Promise = global.Promise;
//
// mongoose.Promise = global.Promise;
// mongoose.connect(databasePath, {
//   keepAlive: true,
//   reconnectTries: Number.MAX_VALUE,
//   useMongoClient: true
// });
//
// // mongoose.set('debug', true);
//
//
// mongoose.connection.on('error', (err) => {
//   console.error(err);
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
//   process.exit();
// });
//
// console.log('Connected to ' + databasePath);
//
// process.on('uncaughtException', (err) => {
//   console.log(`Uncaught Exception: `, err);
//   console.log(err.stack);
// });
// process.on('unhandledRejection', (err) => {
//   console.log(`Unhandled Rejection: `, err);
//   console.log(err.stack);
// });



const youTubeLink = '';

const channelUrl = 'anthony';

function last(array) {
  return array[array.length - 1];
}

// this is going to be a straight copy with no ability to add a custom title etc

async function downloadVideoForUser(channelUrl, youtubeLink){
  console.log(channelUrl, youtubeLink)

  try {
    const video = youtubedl(youtubeLink,
      // Optional arguments passed to youtube-dl.
      [],
      // Additional options can be given for calling `child_process.execFile()`.
      { cwd: __dirname });

    video.on('error', function(error){
      // ERROR: QLG6pPMwhwQ: YouTube said: Unable to extract video data
      // match with the text (error.stderr) above and handle this case
      console.log(error.stderr);
    })

    video.on('end', function(){
      // ERROR: QLG6pPMwhwQ: YouTube said: Unable to extract video data
      // match with the text (error.stderr) above and handle this case
      console.log('done original scrape');
    })

// Will be called when the download starts.
    video.on('info', async function(info) {

      // console.log(info);

      console.log(info.thumbnails);

      // console.log(info);

      var lastThumbnail = last(info.thumbnails);

      console.log(lastThumbnail);

      // TODO: download this file, move it to proper directory with proper name,
      console.log(lastThumbnail.url);







      // delete info.formats
      // console.log(info);

      let format360pDetected = false;
      let format720pDetected = false;

      let format360pformatCode;
      let format720pformatCode;


      for(const format of info.formats){

        console.log('format id : ' + format.format_id);

        let hasAudioAndVideo = false;

        const hasAudio = format.acodec !== 'none';
        const hasVideo = format.vcodec !== 'none';

        hasAudioAndVideo = hasAudio && hasVideo;

        console.log('stream has audio and video ' + hasAudioAndVideo)

        // figure out all the formats that have audio and video and act according to the format note (360p, 720p)

        if(hasAudioAndVideo){

          // const formatNote =  format.format_id || format.format_note;

          const formatNote =  format.format_note;

          if(formatNote == '360p'){

            format360pformatCode = format.format_id;

            console.log('360p upload');
            format360pDetected = true;

          }

          if (formatNote == '720p'){
            console.log('720p upload');

            format720pDetected = true;

            format720pformatCode = format.format_id;
          } else {
            console.log('NOT 720P OR 360P')


          }


          console.log(format.format_note);

          console.log(format.vcodec , format.acodec)
          // console.log(format);
        }


      }

      console.log('here');
      console.log(format360pDetected)
      console.log(format720pDetected)

      const user = 'anthony';
      const downloadLocation = `/uploads/${user}`;

      const uploadingUser = await User.findOne({
        channelUrl
      });

      console.log(uploadingUser._id + ' here');

      const uniqueTag = randomstring.generate(7);

      const lastThumbnailUrl = lastThumbnail.url;

      var re = /(?:\.([^.]+))?$/;

      var extension = re.exec(lastThumbnailUrl)[1];




      // instantiate upload
      // give it status and uploader and it will work
      let upload = new Upload({
        uploader: uploadingUser._id,
        title : info.fulltitle,
        description : info.description,
        fileType: 'video',
        fileExtension : '.mp4',
        uniqueTag,
        youTubeDLData: info,
        status: 'completed',

        // TODO: this is for dev purposes
        uploadServer: 'http://localhost:3000/uploads'
      });

      await upload.save();

      const downloadResponse = await downloadAndSaveThumbnails(lastThumbnailUrl, uniqueTag, channelUrl, extension);

      upload.thumbnails.custom = `${uniqueTag}-custom.${extension}`;

      await upload.save();



      // "thumbnails" : {
      //   "custom" : "EnQPn7t-custom.jpg"
      // }


      const directory = `uploads/${uploadingUser.channelUrl}/${uniqueTag}.mp4`;



      if(format360pDetected && !format720pDetected){

        console.log('download 360p video');

        console.log('format code ' + format360pformatCode)

        const video1 = youtubedl(youtubeLink,
          // Optional arguments passed to youtube-dl.
          ['--format=' + format360pformatCode],
          // Additional options can be given for calling `child_process.execFile()`.
          { cwd: __dirname })

        // console.log(video1)

        // Will be called when the download starts.
        video1.on('info', function(info) {
          console.log(info);

          console.log('Download started')
          console.log('filename: ' + info._filename)
          console.log('size: ' + info.size)
        });

        video1.pipe(fs.createWriteStream(directory))

        video1.on('error', function(error){
          console.log(error);
        });

        video1.on('end', function(){
          console.log('all done');
        })


      } else if (format360pDetected && format720pDetected){

        console.log('download 720p video');

        const video1 = youtubedl(youtubeLink,
          // Optional arguments passed to youtube-dl.
          ['--format=' + format720pformatCode],
          // Additional options can be given for calling `child_process.execFile()`.
          { cwd: __dirname })

        // Will be called when the download starts.
        video1.on('info', function(info) {
          console.log('Download started')
          console.log('filename: ' + info._filename)
          console.log('size: ' + info.size)
        });

        video1.pipe(fs.createWriteStream(directory))

        video1.on('error', function(error){
          console.log(error);
        })

        video1.on('end', function(){
          console.log('all done');
        })


      } else {
        console.log('what the heck is this!')
      }

      // console.log(info.formats);
      // console.log('Download started')
      // console.log('filename: ' + info._filename)
      // console.log('size: ' + info.size)

      // duration
      // height

    })

    // video.pipe(fs.createWriteStream('myvideo.mp4'))

  } catch (err){
    // console.log(err);
    //
    // console.log(err.stderr + ' stderr')
  }




}

// downloadVideoForUser(channelUrl, youTubeLink);



module.exports = downloadVideoForUser;