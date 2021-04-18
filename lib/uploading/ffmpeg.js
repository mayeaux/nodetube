const ffmpeg = require('fluent-ffmpeg');
const timeHelper = require('../../lib/helpers/time');
const User = require('../../models/index').User;
const fs = require('fs-extra');
const Promise = require('bluebird');
const concat = require('concat-files');
const probe = require('node-ffprobe');

const redisClient = require('../../config/redis');

const { saveAndServeFilesDirectory } = require('../../lib/helpers/settings');



// function thing(){
//   estimatedProcessingSecondsLeft = Number(data.conversionTimeLeft);
//
// // TODO: move this to the backend
//   setIntervalX(() => {
//
//     $('#processingTimeElapsed').text(`Time elapsed: ${formattedSecondsElapsed ? formattedSecondsElapsed : "calculating ..."}`)
//
//     $('#estimatedProcessingTimeLeft').text(`Estimated time to completion: ${formattedEstimatedProcessingTimeLeft ? formattedEstimatedProcessingTimeLeft : "calculating ..."}`);
//
//     $('#estimatedTotalProcessingTime').text(`Total estimated conversion time: ${formattedEstimatedTotalProcessingTime ? formattedEstimatedTotalProcessingTime : "calculating ..."}`)
//
//   }, 1000 * 1, intervalSeconds)
// }




// uploadedPath where the upload file location is
// uniqueTag
// upload
// channelUrl

// b2, hostFilePath, bucket are all for b2 and should be pulled out
function takeAndUploadThumbnail(uploadedPath, uniqueTag, upload, channelUrl, b2, hostFilePath, bucket){
  // 1 - Create a new Promise
  return new Promise(function (resolve, reject) {
      /** save thumbnail to `./uploads/${channelUrl}/uniqueTag + '.png` **/


        // TODO: should optimize this for lower values

      // take a shot at 1 second (why 1 second as opposed to 0?)
      const command = ffmpeg(uploadedPath).screenshots({
        timestamps: [1],
        filename: uniqueTag + '.jpg',
        folder: `${saveAndServeFilesDirectory}/${channelUrl}/`
      }).on('end', async function(){
        command.kill();

        // save on the document the name of the generated thumbnail
        upload.thumbnails.generated = uniqueTag + '.jpg';
        upload = await upload.save();

        resolve('success');

        // TODO: pull out into its own function
        // for b2 integration, upload to b2 if it's prod and you're supposed to
        if(process.env.NODE_ENV == 'production' && process.env.UPLOAD_TO_B2 == 'true'){
          (async function(){
            const response = await b2.uploadFileAsync(`${saveAndServeFilesDirectory}/${channelUrl}/` + uniqueTag + '.png', {
              name : hostFilePath + '.png',
              bucket // Optional, defaults to first bucket
            });

            // log response
            console.log(response);
            // save thumbnail url
            upload.thumbnailUrl = response;
            await upload.save();
          })();
        }

      });

    });
}

function getSecondsRemaining(currentProgress, secondsSinceStarting, remaining = 100){

  const amountPerSecond = currentProgress / secondsSinceStarting
  const secondsRemaining = (remaining - currentProgress) / amountPerSecond

  return Math.round(secondsRemaining)
}

function setRedisClient({ currentSeconds, uniqueTag, progress, force }){

  const secondsRemaining = getSecondsRemaining(progress, currentSeconds);
  const currentSecond = new Date().getSeconds();

  // only update redis every third second just in case it's over a network

  if(force == true){
    redisClient.setAsync(`${uniqueTag}timeLeft`, Math.ceil(secondsRemaining))
    redisClient.expireAsync(`${uniqueTag}timeLeft`, 5)

    redisClient.setAsync(`${uniqueTag}uploadProgress`, Math.ceil(progress))
  } else if (currentSecond % 3 == 0 ) {
    redisClient.setAsync(`${uniqueTag}timeLeft`, Math.ceil(secondsRemaining))
    redisClient.expireAsync(`${uniqueTag}timeLeft`, 5)

    redisClient.setAsync(`${uniqueTag}uploadProgress`, Math.ceil(progress))
  }
}

// setRedisClient();

function convertVideo({ uploadedPath, title, bitrate, savePath, uniqueTag }){
  return new Promise(function(resolve, reject) {

    let command;
    if(bitrate > 2500) {

      command = ffmpeg(uploadedPath).videoCodec('libx264').audioCodec('aac').format('mp4')
        .outputOptions([ '-preset medium', '-b:v 2500k' ]);

    } else {
      command = ffmpeg(uploadedPath).videoCodec('libx264').audioCodec('aac').format('mp4')

    }

    let secondCounter = 0;

    setInterval(function(){
      secondCounter = secondCounter + 1;
    }, 1000 * 1)

    function getSecondsLeftFromProgress(percentDone, secondCounter){

      const percentPerSecond = percentDone/secondCounter;

      const estimatedSecondsTo100Percent = (100 / percentDone) * secondCounter;

      return estimatedSecondsTo100Percent

    }

    // progress comes out at as an object
    // number representing progress (0-100)
    // { frames: 616,
    //   currentFps: 153,
    //   currentKbps: 834.9,
    //   targetSize: 1024,
    //   timemark: '00:00:10.04',
    //   percent: 6.819108007287997 }
    command.on('progress', function (progress) {

      const percentDone = Math.round(progress.percent);

      console.log(percentDone + ' percent done');

      const secondsToCompletion = getSecondsLeftFromProgress(percentDone, secondCounter);

      const secondsRemaining = Math.round(secondsToCompletion - secondCounter);

      const formattedSecondsToCompletion = timeHelper.secondsToFormattedTime(secondsToCompletion);

      // "It has taken ___ seconds so far, it is estimated to be done in ___ total seconds leaving left for processing."

      // TODO: calculate the time left here
      const string = `Your upload is ${percentDone}% done being processed. \n\n It will be completed in approximately ${secondsRemaining} seconds.`;

      // console.log(secondsLeft + 'seconds left');

      // console.log(string);

      redisClient.setAsync(`${uniqueTag}uploadProgress`, string);
      redisClient.expireAsync(`${uniqueTag}uploadProgress`, 5);


      // setRedisClient({ progress: progress.percent, uniqueTag, currentSeconds: secondCounter });
      // TODO: send this to the function that will update redis every 5 seconds
      // console.log(`${title}: CONVERTED: ${progress.percent}`);
      // console.log(JSON.stringify(progress));
      // console.log('Processing: ' + progress.targetSize + ' KB converted');
    })



    .on('end', async () => {
      console.log('DONE CONVERTING VIDEO');

      command.kill();

      return resolve('success');

    }).save(savePath)

    .on('error', function(error, stdout, stderr){
      console.log(error, stdout, stderr);
    });

  });
}

async function convertToMostCompatible(){
  ffmpeg('./input.mp4').videoCodec('libx264').audioCodec('aac').format('mp4')
    .outputOptions([
      '-pix_fmt yuv420p',
      '-profile:v baseline',
      '-level 3'
    ])
    .on('progress', function (progress) {
      console.log(`CONVERTED: ${Math.ceil(progress.percent)}%`);
    })
    .on('end', async () => {

      console.log('Processing finished !');

    }).save(`./testThing.mp4`);
}

function concatPromise(fileNameArray, newFileName) {
  // 1 - Create a new Promise
  return new Promise(function (resolve, reject) {
    // 2 - Copy-paste your code inside this function
    concat(fileNameArray, newFileName, function (err) {
      // 3 - in your async function's callback
      // replace return by reject (for the errors) and resolve (for the results)
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function ffprobePromise(filePath) {
  // 1 - Create a new Promise
  return new Promise(function (resolve, reject) {
    // 2 - Copy-paste your code inside this function
    probe(filePath, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}




module.exports = {
  takeAndUploadThumbnail,
  convertVideo,
  ffprobePromise,
  setRedisClient
};