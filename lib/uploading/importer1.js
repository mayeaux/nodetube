const Promise = require('bluebird');
const requestModule = require('request');
const request = Promise.promisifyAll(requestModule);
const fs = Promise.promisifyAll(require('fs'));
const youtubedl = require('youtube-dl');
const B2 = require('easy-backblaze');
const randomstring = require("randomstring");
const exec = require('child_process').exec;
const _ = require('lodash');
const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const mkdirp = Promise.promisifyAll(require('mkdirp'));

dotenv.load({ path: '../.env.example' });

const timeoutTimeInMinutes = process.env.YT_REFRESH_IN_MINS || 60;
console.log('timeout time ' + 1000 * 60 * timeoutTimeInMinutes);

// functionality to reboot every hour
setTimeout(function(){
  process.exit();
}, 1000 * 60 * timeoutTimeInMinutes);

const databasePath = process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/nov28nodetube'
console.log('DATABASE: ' + databasePath);

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;

mongoose.Promise = global.Promise;
mongoose.connect(databasePath, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true
});

// mongoose.set('debug', true);


mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

console.log('Connected to ' + databasePath);

process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: `, err);
  console.log(err.stack);
});
process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection: `, err);
  console.log(err.stack);
});

/** BACKBLAZE CONFIG **/
const apiKey = 'youtubeApiKey';

/** GET NEXT YOUTUBE VIDEOS **/
async function getNextResponseItems(items, channelId, nextToken) {
  let channelAPI = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}` +
    `&channelId=${channelId}&part=snippet,id&order=date&maxResults=50`;

  // add a token if one exists
  if (nextToken) {
    channelAPI = channelAPI + `&pageToken=${nextToken}`;
  }

  // hit youtube api
  const nextResponse = await request.getAsync(channelAPI);

  // parse json response
  const body = JSON.parse(nextResponse.body);

  // console.log(body);

  // concat to items if items already exists
  items = body.items.concat(items);

  // if there's a still next page token, recursively call self
  if (body.nextPageToken) {
    return await getNextResponseItems(items, channelId, body.nextPageToken)
  } else {
    // return items if no next page token
    return items
  }
}

// if there is a next page token, request that, continue adding them to an array
// then you have an array with all the videos


/** **/
async function getVideoInformation(passedItems, channelId){

  // amount of yt videos to get (can lower for testing purposes)
  const amountOfYTVideos = 50;

  // build youtube url to hit
  const channelAPI = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${amountOfYTVideos}`;

  // hit youtube
  const response =  await request.getAsync(channelAPI);

  // parse youtube response as json
  let responseData = JSON.parse(response.body);

  // sort by latest published at
  responseData.items = _.sortBy(responseData.items, [function (upload) {
    return upload.snippet.publishedAt
  }]);

  return await getNextResponseItems(passedItems, channelId)

}

let itemsArray = [];

// have to explicitly turn it on
const mirrorOn = process.env.MIRROR_ON == 'true';

// backup on
const backupOn = process.env.BACKUP_ON == 'true';

console.log('MIRROR ON : ' + mirrorOn);
console.log('BACKUP ON : ' + backupOn);

// check a specific youtube title against db
function shouldIDownload(title, userUploads){

  if(!userUploads){
    return true
  }

  // check if title already exists
  for(const upload of userUploads){

    const titleMatch = upload.title == title;

    // only match this guy if there is a youtube Data
    let youtubeDataTitleMatch;
    if(upload.youTubeData){
      youtubeDataTitleMatch = upload.youTubeData.snippet.title == title;
    } else {
      youtubeDataTitleMatch = false;
    }

    if(titleMatch || youtubeDataTitleMatch) return false
  }

  // return whether or not it is already downloaded
  return true
}

/** download and save thumbnails locally **/
async function downloadAndSaveThumbnails(YTVideo, user, upload){

  const channelUrlFolder = `./uploads/${user.channelUrl}`;

  // get thumbnail url for medium thumbnail
  const mediumThumbnailUrl = YTVideo.snippet.thumbnails.medium.url;

  // get thumbnail url for medium thumbnail
  const largeThumbnailUrl = YTVideo.snippet.thumbnails.high.url;

  // get the thumbnail
  const mediumThumbnail = await request.getAsync(mediumThumbnailUrl, { encoding: 'binary' });

  const largeThumbnail = await request.getAsync(largeThumbnailUrl, { encoding: 'binary' });

  await mkdirp.mkdirpAsync(channelUrlFolder);

  // save the thumbnail locally
  await fs.writeFileAsync(`${channelUrlFolder}/${upload.uniqueTag}-medium.jpg`, mediumThumbnail.body, 'binary');

  await fs.writeFileAsync(`${channelUrlFolder}/${upload.uniqueTag}-large.jpg`, largeThumbnail.body, 'binary');

  console.log(`THUMBNAILS SAVED LOCALLY FOR ${YTVideo.snippet.title}`);
};



/** Download video from YouTube, upload to PewTube **/
async function backupChannel(user){

  console.log(`RUNNING BACKUP CHANNEL FUNCTIONALITY FOR ${user.channelName || user.channelUrl}`);

  // Adding in empty array from global window (itemsArray)
  let videos = await getVideoInformation(itemsArray, user.youtubeChannelId);

  // console.log(videos);

  // sort by so oldest videos go first
  videos = _.sortBy(videos, [function (upload) {
    return upload.snippet.publishedAt
  }]);

  // adding amount to download
  let downloadNumber = 0;

  // find as uploads for the user
  let userUploads = await Upload.find({
    uploader : user._id,
  });

  // loop through YT download
  for(const YTVideo of videos){

    // determine if you want to download that video
    const shouldDownload = shouldIDownload(YTVideo.snippet.title, userUploads);

    if(!shouldDownload){
      // console.log('No need to download');
    } else

    // only execute if the kind is video (could also be playlist I think)
    if(shouldDownload && YTVideo.id.kind == 'youtube#video'){

      downloadNumber++;

      // 1/n where n should equal the amount of users
      const minutesToDelay = 70;

      const delayAmount = (downloadNumber - 0.99) * 1000 * 60 * minutesToDelay;

      console.log(`DOWNLOADING ${YTVideo.snippet.title} FOR ${user.channelName || user.channelUrl} IN ${ Math.round(delayAmount / 1000 ) } SECONDS`);

      await Promise.delay(delayAmount);

      const channelUrlFolder = `./uploads/${user.channelUrl}`;

      // generate unique tag for nodetube Upload
      const uniqueTag = randomstring.generate(7);

      // instantiate upload
      let upload = new Upload({
        uploader: user._id,
        title : YTVideo.snippet.title,
        description : YTVideo.snippet.description,
        fileType: 'video',
        hostUrl,
        fileExtension : '.mp4',
        uniqueTag,
        youTubeData: YTVideo
      });

      await downloadAndSaveThumbnails(YTVideo, user, upload);

      upload.thumbnails.medium = `${uniqueTag}-medium.jpg`;
      upload.thumbnails.large = `${uniqueTag}-large.jpg`;

      await upload.save();

      // load ytdl options
      const ytdlOptions = {
        cwd: __dirname,
        maxBuffer: Infinity
      };

      // create youtube-dl instance
      const video = youtubedl(`http://www.youtube.com/watch?v=${YTVideo.id.videoId}`,[], ytdlOptions);

      // get video size
      video.on('info', async function(info) {
        upload.fileSize = info.size;
        await upload.save();
      });

      let pos = 0;
      video.on('data', function data(chunk) { pos += chunk.length; });

      video.on('end', async function() {

        console.log(`FINISHED DOWNLOADING ${YTVideo.snippet.title}`);

        if(process.env.NODE_ENV == 'production'){
          await uploadAssetsToBackblaze(user, upload);
        }

        upload.status = 'completed';
        await upload.save();

        // save to user array
        user.uploads.push(upload._id);
        await user.save();

        return console.log(`SUCCESSFULLY SAVED ${YTVideo.snippet.title}`)
      });

      // pipe the response from ytdl to disk
      video.pipe(fs.createWriteStream(`${channelUrlFolder}/${uniqueTag}.mp4`));

    }
  }
}

async function backupJob(){
  console.log('RUNNING BACKUP');

  // find all users with mirror on
  let users = await User.find({
    youtubeChannelId : { $exists: true },
    'userSettings.backupOn' : true,
    'privs.youtubeBackup' : true,
    // channelUrl: 'AltRightAndy' // hardcode for testing
  });

  // if there's users
  if(users.length > 0){
    console.log(users.length + ' Users');

    // for each user, download and upload youtube video
    for(user of users){
      // determine if they need to download something and then facilitate it

      try {
        backupChannel(user, users.length)
      } catch (err){
        console.log('err');
        console.log(err)
      }
    }
  } else {
    console.log('No users')
  }
}

// run mirror job and then set it on a queue at 2.5 minutes
if(backupOn){
  backupJob();
  // setInterval(backupJob, 1000 * 60 * 60);
}



// let alreadyRunning = false;
//
// /** Download video from YouTube, upload to PewTube **/
// async function mirrorFunctionality(user){
//
//
//   console.log('RUNNING MIRROR FUNCTIONALITY FOR ' + user.channelName);
//
//   let items = await getVideoInformation([], user.youtubeChannelId);
//   // sort by published at (most recent videos come first)
//   items = _.sortBy(items, [function (upload) {
//     return upload.snippet.publishedAt
//   }]).reverse();
//
//   items.length = 5;
//
//   let amountToDownload=0;
//   let amountOfItems=0;
//
//   for(const YTVideo of items){
//     alreadyRunning = true;
//     // mostly recently uploaded to youtube video
//     const latestVideo = YTVideo;
//
//     // get latest video's id and title
//     const videoId = latestVideo.id.videoId;
//     const title = latestVideo.snippet.title;
//
//     // determine if you want to download that video
//     const shouldDownload = await shouldIDownload(title, user);
//
//     if(shouldDownload && YTVideo.id.kind == 'youtube#video') {
//       amountToDownload++;
//
//       const timeToDelay = (amountToDownload - 0.999) * 1000 * 60 * 2;
//
//       console.log(timeToDelay);
//
//       await Promise.delay(timeToDelay);
//
//       // console.log('not proper');
//
//       console.log(`DOWNLOADING ${title} FOR ${user.channelName}`);
//
//       // get thumbnail url for medium thumbnail
//       const thumbnailUrl = latestVideo.snippet.thumbnails.medium.url;
//
//       const largeThumbnailUrl = latestVideo.snippet.thumbnails.high.url;
//
//       // get the thumbnail
//       const responseThing = await request.getAsync(thumbnailUrl, {encoding: 'binary'});
//
//       const largeThumbnailResponse = await request.getAsync(largeThumbnailUrl, {encoding: 'binary'});
//
//       const channelUrlFolder = `./uploads/${user.channelUrl}`;
//
//       await mkdirp.mkdirpAsync(channelUrlFolder);
//
//       // save the thumbnail locally
//       await fs.writeFileAsync(`${channelUrlFolder}/${videoId}-medium.jpg`, responseThing.body, 'binary');
//
//       await fs.writeFileAsync(`${channelUrlFolder}/${videoId}-large.jpg`, largeThumbnailResponse.body, 'binary');
//
//       console.log('thumbnail saved');
//
//       // get description to save
//       const description = latestVideo.snippet.description;
//
//       // instantiate youtube-dl module
//       var video = youtubedl(`http://www.youtube.com/watch?v=${videoId}`,
//         // Optional arguments passed to youtube-dl.
//         [],
//         // Additional options can be given for calling `child_process.execFile()`.
//         {
//           cwd: __dirname,
//           maxBuffer: Infinity
//
//         });
//
//       // calculate video size
//       var size = 0;
//       video.on('info', function (info) {
//         size = info.size;
//
//       });
//
//       var pos = 0;
//       video.on('data', function data(chunk) {
//         pos += chunk.length;
//         // `size` should not be 0 here.
//         if (size) {
//           var percent = (pos / size * 100).toFixed(2);
//           // console.log(percent);
//         }
//       });
//
//       video.on('end', async function () {
//         console.log('\n finished downloading!');
//
//         // generate unique tag for pewtube Upload
//         const uniqueTag = randomstring.generate(7);
//
//         // instantiate Upload for database
//         let upload = new Upload({
//           uploader: user._id,
//           title,
//           description,
//           fileType: 'video',
//           hostUrl,
//           fileExtension: '.mp4',
//           fileSize: size,
//           uniqueTag,
//           youTubeData: latestVideo
//         });
//
//         console.log('ABOUT TO UPLOAD THUMBNAIL');
//
//         // upload thumbnail to b2
//         const thumbnailUploadResponse = await b2.uploadFileAsync(`${channelUrlFolder}/${videoId}-medium.jpg`, {
//           name: `${user.channelUrl}/${uniqueTag}-medium` + '.jpg',
//           bucket // Optional, defaults to first bucket
//         });
//
//         // upload thumbnail to b2
//         const largeThumbnailUploadResponse = await b2.uploadFileAsync(`${channelUrlFolder}/${videoId}-large.jpg`, {
//           name: `${user.channelUrl}/${uniqueTag}-large` + '.jpg',
//           bucket // Optional, defaults to first bucket
//         });
//
//         // save thumbnail url to Upload
//         console.log(thumbnailUploadResponse);
//         console.log(largeThumbnailUploadResponse);
//         upload.thumbnailUrl = thumbnailUploadResponse;
//
//         upload.thumbnails.large = `${videoId}-large.jpg`;
//         upload.thumbnails.medium = `${videoId}-medium.jpg`;
//
//         console.log('ABOUT TO UPLOAD VIDEO');
//
//         // save video to Upload
//         const videoUploadResponse = await b2.uploadFileAsync(`${channelUrlFolder}/${uniqueTag}.mp4`, {
//           name: `${user.channelUrl}/${uniqueTag}` + '.mp4',
//           bucket // Optional, defaults to first bucket
//         });
//
//         // save video upload  url to Upload
//         console.log(videoUploadResponse);
//         upload.uploadUrl = videoUploadResponse;
//         await upload.save();
//
//         // save to user array
//         user.uploads.push(upload._id);
//         await user.save();
//
//         amountOfItems++;
//
//         if (amountOfItems == items.length) {
//           console.log('NOTING USER IS DONE');
//
//           amountOfDoneUsers++
//         }
//
//       });
//
//       // pipe the response from ytdl to disk
//       video.pipe(fs.createWriteStream(`${channelUrlFolder}/${uniqueTag}.mp4`));
//
//       // 1/n where n should equal the amount of users
//
//     } else {
//
//       amountOfItems++;
//
//       console.log('ALREADY DOWNLOADED')
//
//       if (amountOfItems == items.length) {
//         console.log('NOTING USER IS DONE');
//
//         amountOfDoneUsers++
//       }
//
//     }
//
//
//   }
// }
//

//
// let amountOfUsers = 0;
// let amountOfDoneUsers = 0;
//
//
// async function mirrorJob(){
//   console.log('AMOUNT OF USERS: ' + amountOfUsers);
//   console.log('AMOUNT OF DONE USERS: ' + amountOfDoneUsers);
//
//   if(amountOfUsers != amountOfDoneUsers){
//     console.log('ALREADY IN PROGRESS');
//     return
//   }
//
//   console.log('RUNNING MIRROR');
//
//
//   // find all users with mirror on
//   const users = await User.find({
//     youtubeChannelId : { $exists: true },
//     'userSettings.mirrorOn' : true
//   });
//
//   amountOfUsers = users.length;
//   amountOfDoneUsers = 0;
//
//   // if there's users
//   if(users.length > 0){
//     console.log(users.length + ' Users');
//
//     // for each user, download and upload youtube video
//     for(user of users){
//       // determine if they need to download something and then facilitate it
//       await mirrorFunctionality(user)
//
//
//
//     }
//   } else {
//     console.log('No users')
//   }
// }
//
//
//
// if(mirrorOn){
//   mirrorJob();
//   setInterval(mirrorJob, 1000 * 60 * 5);
// }
//
//