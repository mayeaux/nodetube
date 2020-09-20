const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const FileType = require('file-type');
const webp = require('webp-converter');


const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;



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

    // convert to png
    const result = await webp.dwebp(thumbnailDestination, newDestination, "-o");

    console.log(result);
    console.log('ITS A WEBP')

    extension = 'png'
  }

  // TODO: test : is this webp?

  // if so, have to convert that file to png via that libary
  // const result = webp.dwebp(originalFile, convertedFile, "-o");

  // then return the path of that file as this function

  // also pass that extension

  // return the extension

  console.log(`THUMBNAILS SAVED LOCALLY`);

  console.log(uniqueTag)

  return extension

};


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

      delete info.formats;

      console.log(info);
      //
      // console.log(info.thumbnails);

      const videoData = info;

      const height = videoData.height;

      const width = videoData.width;

      const aspectRatio = height / width;

      const title = videoData.title;

      const durationInSeconds = videoData._duration_raw;

      const fileSize = videoData.size;

      // var result = yourstr.replace(/^(?:00:)?0?/, '');

      let formattedDuration = videoData._duration_hms;

      if(formattedDuration) formattedDuration = formattedDuration.replace(/^(?:00:)?0?/, '');



      // console.log(info);

      var lastThumbnail = last(info.thumbnails);


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


      console.log(aspectRatio, title, durationInSeconds, fileSize, formattedDuration)

      // instantiate upload
      // give it status and uploader and it will work
      let upload = new Upload({
        uploader: uploadingUser._id,
        title,
        description : info.description,
        fileType: 'video',
        fileExtension : '.mp4',
        uniqueTag,
        youTubeDLData: info,
        status: 'completed',
        rating: 'allAges',
        category: 'uncategorized',
        dimensions: {
          height,
          width,
          aspectRatio
        },
        formattedDuration,
        fileSize,
        durationInSeconds,


        // TODO: this is for dev purposes
        uploadServer: 'http://localhost:3000/uploads'
      });

      await upload.save();

      // this comes back as an extension
      const downloadResponse = await downloadAndSaveThumbnails(lastThumbnailUrl, uniqueTag, channelUrl, extension);

      console.log(downloadResponse + ' DOWNLOAD RESPONSE')

      upload.thumbnails.custom = `${uniqueTag}-custom.${downloadResponse}`;

      upload.processingCompletedAt = new Date();

      await upload.save();



      // "thumbnails" : {
      //   "custom" : "EnQPn7t-custom.jpg"
      // }


      const directory = `uploads/${uploadingUser.channelUrl}/${uniqueTag}.mp4`;

      let arguments = [];
      // set the url for ytdl
      // verbose output
      // arguments.push('--format=135');
      //
      // // arguments.push('-f', 'bestvideo+bestaudio/best');
      //
      // arguments.push('--add-metadata');
      //
      // arguments.push('--ffmpeg-location');
      //
      // arguments.push('--no-mtime');
      //
      // arguments.push('--ignore-errors');
      //
      // arguments.push('--merge-output-format');
      //
      // arguments.push('mp4');
      //
      // arguments.push('-f=bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');

      // arguments.push('-f=bestvideo[height<730][ext=mp4]+bestaudio[ext=m4a]/best[height<730]/best[ext=mp4][height<730]');

      // arguments.push('--ffmpeg-location=' + ffmpegPath);

      arguments.push('--format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');

      arguments.push('--merge-output-format=mp4')

      console.log(arguments)

      const video1 = youtubedl(youtubeLink,
        // Optional arguments passed to youtube-dl.
        arguments,
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname });

      // console.log(video1)

      var size = 0;


      var pos = 0;
      video1.on('data', function data(chunk) {
        pos += chunk.length;
        // `size` should not be 0 here.
        if (size) {
          var percent = (pos / size * 100).toFixed(2);
          console.log(percent);
        }
      });


      // Will be called when the download starts.
      video1.on('info', function(info) {

        size = info.size;
        // console.log(info);

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
      });


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