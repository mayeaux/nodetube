const ffmpeg = require('fluent-ffmpeg');
const User = require('../../models/index').User;
const fs = require('fs-extra');
const Promise = require('bluebird');
const concat = require('concat-files');
const probe = require('node-ffprobe');

const redisClient = require('../../config/redis');

const { saveAndServeFilesDirectory } = require('../../lib/helpers/settings');

function takeAndUploadThumbnail(uploadedPath, uniqueTag, hostFilePath, bucket, upload, channelUrl, b2){
  // 1 - Create a new Promise
  return new Promise(function (resolve, reject) {
      /** save thumbnail to `./uploads/${channelUrl}/uniqueTag + '.png` **/

      const command = ffmpeg(uploadedPath).screenshots({
        timestamps: [1],
        filename: uniqueTag + '.png',
        folder: `${saveAndServeFilesDirectory}/${channelUrl}/`
      }).on('end', async function(){
        command.kill();

        // save on the document the name of the generated thumbnail
        upload.thumbnails.generated = uniqueTag + '.png';
        upload = await upload.save();

        resolve('success');

        // TODO: pull out into its own function
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

function setRedisClient({ uniqueTag, progress }){

  const currentSecond = new Date().getSeconds();

  console.log(currentSecond);

  console.log(uniqueTag);

  console.log(`${uniqueTag}uploadProgress`);

  console.log(progress);

  if (currentSecond % 5 == 0 ) {
    redisClient.setAsync(`${uniqueTag}uploadProgress`, Math.round(progress))
  }
}

// setRedisClient();

function compressVideo({ uploadedPath, uniqueTag, channelUrl, title, bitrate, savePath }){

  return new Promise(function(resolve, reject) {

    const command = ffmpeg(uploadedPath).videoCodec('libx264').audioCodec('aac').format('mp4')
      .outputOptions([ '-preset medium', '-b:v 1000k' ]);

    command.on('progress', function (progress) {
      // TODO: send this to the function that will update redis every 5 seconds

      setRedisClient({
        progress: progress.percent,
        uniqueTag
      });

      console.log(`${title}: CONVERTED: ${progress.percent}`);
      // console.log(JSON.stringify(progress));
      // console.log('Processing: ' + progress.targetSize + ' KB converted');
    })
      .on('end', async () => {
        console.log('DONE CONVERTING VIDEO');

        // mark upload as 100% done
        setRedisClient({
          progress: 100,
          uniqueTag
        });

        command.kill();

        return resolve('success');


      }).save(savePath);

  });
}

function convertVideo({ uploadedPath, title, bitrate, savePath, uniqueTag }){
  return new Promise(function(resolve, reject) {

    let command;
    if(bitrate > 2500) {

      command = ffmpeg(uploadedPath).videoCodec('libx264').audioCodec('aac').format('mp4')
        .outputOptions([ '-preset medium', '-b:v 1000k' ]);

    } else {
      command = ffmpeg(uploadedPath).videoCodec('libx264').audioCodec('aac').format('mp4')

    }

    command.on('progress', function (progress) {
      setRedisClient({ progress, uniqueTag  });
      // TODO: send this to the function that will update redis every 5 seconds
      console.log(`${title}: CONVERTED: ${progress.percent}`);
      // console.log(JSON.stringify(progress));
      // console.log('Processing: ' + progress.targetSize + ' KB converted');
    })
    .on('end', async () => {
      console.log('DONE CONVERTING VIDEO');

      // mark upload as 100% done
      setRedisClient({
        progress: 100,
        uniqueTag
      });

      command.kill();

      return resolve('success');

    }).save(savePath);

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
      console.log(`CONVERTED: ${Math.round(progress.percent)}%`);
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
  compressVideo
};