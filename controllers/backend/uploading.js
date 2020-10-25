/**  UNFINISHED **/
/* eslint-disable no-unused-vars */

const Promise = require('bluebird');
var concat = require('concat-files');
var B2 = require('easy-backblaze');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const mkdirp = Promise.promisifyAll(require('mkdirp'));
var randomstring = require('randomstring');
var CombinedStream = require('combined-stream');

const redisClient = require('../../config/redis');

const pagination = require('../../lib/helpers/pagination');
const timeHelper = require('../../lib/helpers/time');
const uploadingHelpers = require('../../lib/uploading/helpers');

const bytesToMb = uploadingHelpers.bytesToMb;

const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;

const sendMessageToDiscord = require('../../lib/moderation/discordWebhooks');

const { saveAndServeFilesDirectory } = require('../../lib/helpers/settings');
const getMediaType = require('../../lib/uploading/media');
const { b2, bucket, hostUrl } = require('../../lib/uploading/backblaze');

const ffmpegHelper = require('../../lib/uploading/ffmpeg');
const {
  markUploadAsComplete,
  updateUsersUnreadSubscriptions,
  runTimeoutFunction,
  userCanUploadContentOfThisRating,
  updateUsersPushNotifications,
  updateUsersEmailNotifications,
  alertAdminOfNewUpload
} = require('../../lib/uploading/helpers');
const backblaze = require('../../lib/uploading/backblaze');

// console.log(`SAVE AND SERVE FILES DIRECTORY: ${saveAndServeFilesDirectory}`);

var resumable = require('../../lib/uploading/resumable.js')(__dirname +  '/upload');

const moderationUpdatesToDiscord = process.env.MODERATION_UPDATES_TO_DISCORD == 'true';

// process.on('warning', (warning) => {
//   console.warn(warning.name);    // Print the warning name
//   console.warn(warning.message); // Print the warning message
//   console.warn(warning.stack);   // Print the stack trace
// });

const winston = require('winston');
//
const { createLogger, format, transports } = require('winston');

// default max bitrate supported without conversion (2500 which is a bit above 720p)
const maxBitrate = 3000;

const uploadsOn = process.env.UPLOADS_ON;
console.log(`UPLOADS ON: ${uploadsOn}\n`);

let uploadLogger;
if(process.env.NODE_ENV !== 'production'){
  // PULL OUT TO OWN FILE
  uploadLogger = winston.createLogger({
    level: 'info',
    format: format.combine(
      format.splat(),
      format.simple()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logfile.log' })
    ]
  });

} else {
  uploadLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logfile.log' })
    ]
  });

}

exports.getUploadProgress = async(req, res) => {
  // example request /user/fred/j9dle/progress

  const uniqueTag = req.body.uniqueTag;

  const upload = await Upload.findOne({
    uniqueTag
  });

  // let the frontend know if the upload or conversion failed
  if(upload && upload.status == 'failed'){
    return res.send('failed');
  }

  // this will cause the client to refresh the page
  if(upload && upload.status == 'completed'){
    return res.send('100');
  }

  const uploadProgress = await redisClient.getAsync(`${uniqueTag}uploadProgress`);
  const conversionTimeLeft = await redisClient.getAsync(`${uniqueTag}timeLeft`);

  console.log('Redis says the uploadProgress is:' + uploadProgress);
  console.log('Redis says the timeLeft is:' + conversionTimeLeft);

  // console.log('Progress:', uploadProgress);
  // console.log('Time left:', conversionTimeLeft);

  // kind of an ugly workaround, if the upload is at 100% converted, mark it as 99%
  // just so backblaze and other things can finish before the frontend redirects
  if(uploadProgress == '100'){
    res.send('99');
  }

  // console.log(value);
  //
  // console.log(req.params);
  //
  // console.log(req.body);
  //
  // console.log(uniqueTag);

  return res.send({uploadProgress, conversionTimeLeft});

};

function areUploadsOff(uploadsOn, isNotTrustedUser, res){

  // allows users to
  if(uploadsOn == 'false' && isNotTrustedUser){
    console.log('HERE');
    res.status(500);
    res.send({ message: 'UPLOADS_OFF'});
    return true;
  }

  return false;
}

function testIfUserRestricted(user, logObject, res){
  const userStatusIsRestricted = user.status == 'uploadRestricted';

  if(userStatusIsRestricted){
    uploadLogger.info('User upload status restricted', logObject);

    res.status(403);
    res.send('Sorry your account is restricted');
    return true;
  }

  return false;
}

function aboutToProcess(res, channelUrl, uniqueTag){
  res.send({
    message: 'ABOUT TO PROCESS',
    url: `/user/${channelUrl}/${uniqueTag}?u=t`
  });
}

const getExtensionString = path.extname;

function generateLogObject(){

}

function moderationIsRequired(user){
  const restrictUntrustedUploads = process.env.RESTRICT_UNTRUSTED_UPLOADS == 'true';

  // if the user is not allowed to auto upload
  const userIsUntrusted = !user.privs.autoVisibleUpload;

  // moderation is required if restrict uploads is on and user is untrusted
  const requireModeration = restrictUntrustedUploads && userIsUntrusted;

  return requireModeration;
}

// check if already uploaded based on the title
async function checkIfAlreadyUploaded(user, title, logObject, res){
  // TODO: File size check

  const alreadyUploaded = await Upload.findOne({
    uploader: user._id,
    title,
    visibility: 'public',
    status: 'completed'
  });

  if(alreadyUploaded){
    uploadLogger.info('Upload title already uploaded', logObject);
    res.status(500);
    res.send({message: 'ALREADY-UPLOADED'});
    return true;
  }

  return false;
}

/** RESPOND EARLY IF ITS AN UNKNOWN FILE TYPE **/
const testIsFileTypeUnknown = async function(upload, fileType, fileExtension, logObject, res){
  if(fileType == 'unknown'){
    upload.status = 'rejected';

    await upload.save();

    logObject.uploadExtension = fileExtension;
    uploadLogger.info('Unknown file type', logObject);

    res.status(500);
    res.send({message: 'UNKNOWN-FILETYPE'});
    return true;
  }

  return false;

};

/**
 * POST /api/upload
 * File Upload API example.
 */
exports.postFileUpload = async(req, res) => {

  try {

    const { description, visibility, title, uploadToken, rating } = req.query;

    if(!userCanUploadContentOfThisRating(process.env.MAX_RATING_ALLOWED, rating)){
      res.status(500);
      res.send('Sorry this instance doesn\'t accept this type of upload');

      return;
    }

    // use an uploadToken if it exists but there is no req.user
    // load req.user with the found user
    if(!req.user && uploadToken){
      req.user = await User.findOne({
        uploadToken
      });
    }

    const user = req.user;

    const { channelUrl } = user;

    // setup logobject for winston
    let logObject = {
      user: channelUrl,
      upload: title
    };

    const isNotTrustedUser = !req.user.privs.autoVisibleUpload;

    const uploadsAreOff = areUploadsOff(uploadsOn, isNotTrustedUser, logObject, res);
    if(uploadsAreOff){ return; }

    // ends the response early if user is restricted
    const userIsRestricted = testIfUserRestricted(user, logObject, res);
    if(userIsRestricted){ return; }

    const uploadAlreadyUploaded = await checkIfAlreadyUploaded(user, title, logObject, res);
    if(uploadAlreadyUploaded){ return; }

    // let upload = setUpload()

    /** WHEN A NEW CHUNK IS COMPLETED **/
    resumable.post(req, async function(status, filename, original_filename, identifier){

      let{ category, subcategory, rating } = req.query;

      const { resumableTotalSize, resumableChunkNumber, resumableTotalChunks } = req.body;

      uploadLogger.info(`Processing chunk number ${resumableChunkNumber} of ${resumableTotalChunks} `, logObject);
      const fileName = filename;
      const fileType = getMediaType(filename);
      let fileExtension = getExtensionString(filename);

      const fileSize = resumableTotalSize;
      const originalFileSizeInMb = bytesToMb(resumableTotalSize);

      if(fileExtension == '.MP4'){
        fileExtension = '.mp4';
      }

      if(category == 'undefined' || category == undefined){
        category = 'uncategorized';
      }

      if(subcategory == 'undefined' || subcategory == undefined){
        subcategory = 'uncategorized';
      }

      const uniqueTag = randomstring.generate(7);

      let upload = new Upload({
        uploader: user._id,
        title,
        description,
        visibility,
        originalFileName: fileName,
        fileType,
        hostUrl,
        fileExtension,
        fileSize,
        originalFileSizeInMb,
        category,
        subcategory,
        rating,
        uniqueTag
      });

      // TODO: not a great design but I don't know a better approach
      // user this after upload object is made because it saves it to db
      const isUnknown = await testIsFileTypeUnknown(upload, fileType, fileExtension, logObject, res);
      if(isUnknown){ return; }

      // where is this used?
      let uploadPath = `./upload/${identifier}`;

      /** FINISHED DOWNLOADING EVERYTHING **/
      if(resumableChunkNumber !== resumableTotalChunks){
        res.send(status);
      } else {
        /** FINISHED DOWNLOADING EVERYTHING **/

        let responseSent = false;

        const channelUrl = user.channelUrl;

        const hostFilePath = `${channelUrl}/${uniqueTag}`;

        // TODO: 'uploadServer' functionality is totally unsupported
        // const uploadServer = process.env.UPLOAD_SERVER || 'uploads1' ;

        const requireModeration = moderationIsRequired(user);

        if(requireModeration){
          upload.visibility = 'pending';
        }

        await upload.save();

        // uploadLogger.info('Upload document added to db', Object.assign({}, logObject, upload));

        // TODO: make this smarter, url etc
        if(requireModeration && moderationUpdatesToDiscord){
          await sendMessageToDiscord(`Pending upload requires moderation on NodeTube.live. https://newtube.app/user/test/${upload.uniqueTag} https://newtube.app/pending ${new Date()}`);
        }

        /** FILE PROCESSING */

        // send user to the upload page and say it's still  processing if the request is waiting after 25 seconds
        // cant seem to pull it out of controller since it accesses timing variables in this backend
        // sure you could use express to get around this but it stays for the time being
        // it seems for sure loaded into memory (resp
        (async function(){
          await Promise.delay(1000 * 25);

          let timeoutUpload = await Upload.findOne({uniqueTag});

          if(timeoutUpload.status !== 'completed'){
            // note the upload is still processing
            timeoutUpload.status = 'processing';
            await timeoutUpload.save();

            uploadLogger.info('Still processing after 25s', logObject);

            // note that we've responded to the user and send them to processing page
            if(!responseSent){
              responseSent = true;

              // dont return here so the rest of the code can process
              aboutToProcess(res, channelUrl, uniqueTag);
            }
          }
        })();

        /** turn filenames into an array for concatenation **/

        // TODO: mark here that you started concatenating
        redisClient.setAsync(`${uniqueTag}uploadProgress`, 'Your upload is beginning processing...');

        // build an array with the names of all the file chunks
        const fileNameArray = [];
        for(let x = 1; x < parseInt(resumableTotalChunks, 10) + 1; x++){
          fileNameArray.push(`${uploadPath}/${x}`);
        }

        var combinedStream = CombinedStream.create();

        // loop through each file and append it to the stream
        for(const fileChunk of fileNameArray){
          combinedStream.append(function(next){
            next(fs.createReadStream(fileChunk));
          });
        }

        combinedStream.pipe(fs.createWriteStream(`${uploadPath}/convertedFile`));

        combinedStream.on('end', async function(){
          /** CONCATENATE FILES AND BEGIN PROCESSING **/
          // concat(fileNameArray, `${uploadPath}/convertedFile`, async function(err){
          //   if(err)throw err;

          uploadLogger.info('Concat done', logObject);

          let bitrate, codecName, codecProfile;

          if(upload.fileType !== 'image'){

            // load the ffprobe data in response
            const response = await ffmpegHelper.ffprobePromise(`${uploadPath}/convertedFile`);

            // console.log(response);

            // save the ffprobe data
            upload.ffprobeData = response;

            // duration in seconds from ffprobe
            upload.durationInSeconds = Math.round(response.format.duration);

            // duration in seconds formatted as smart HH:MM:DD
            upload.formattedDuration = timeHelper.secondsToFormattedTime(Math.round(response.format.duration));

            // TODO: this needs to be made to match against whether it's a video or audio because to
            // TODO : my knowledge streams are not guaranteed to be in order of video -> audio

            // codec name and profile to be used for deciding whether to convert
            codecProfile  = response.streams[0].codecProfile;
            codecName  = response.streams[0].codecName;

            // height and width of video
            const width = response.streams[0].width;
            const height = response.streams[0].height;

            // pretty sure this is kilobit
            // bitrate in kbps
            bitrate = response.format.bit_rate / 1000;

            // save bitrate in kbps
            upload.bitrateInKbps = bitrate;

            // save width, height and aspect ratio on upload
            upload.dimensions.height = height;
            upload.dimensions.width = width;
            upload.dimensions.aspectRatio = height/width;

            //
            // console.log('')

            uploadLogger.info(`BITRATE: ${bitrate}`, logObject);
          }

          // where to save the files locally
          const channelUrlFolder = `${saveAndServeFilesDirectory}/${user.channelUrl}`;

          // file name to save
          const fileName = `${uniqueTag}${fileExtension}`;

          // the full local path of where the file will be served from
          let fileInDirectory = `${channelUrlFolder}/${fileName}`;

          // make user's folder if it doesn't exist yet
          await mkdirp.mkdirpAsync(channelUrlFolder);

          /** MOVE CONVERTED FILE TO PROPER DIRECTORY **/
          await fs.move(`./${uploadPath}/convertedFile`, fileInDirectory);

          uploadLogger.info('Moved file to user\'s directory', logObject);

          /** DELETE RESUMABLE PARTS **/
          await fs.remove(`./${uploadPath}`);

          uploadLogger.info('Removed original file parts', logObject);

          // save filesize
          const convertedFileStats = fs.statSync(fileInDirectory);

          upload.fileSize = convertedFileStats.size;
          await upload.save();

          console.log('done moving file');

          const specificMatches = ( codecName == 'hevc' || codecProfile == 'High 4:4:4 Predictive' );

          if(specificMatches || bitrate > maxBitrate){
            upload.fileType = 'convert';
          }

          /** TELL THE USER WE ARE CONVERTING / COMPRESSING THEIR VIDEO **/
          if(upload.fileType == 'convert' || bitrate > maxBitrate || upload.fileType == 'video'){

            // if upload is a convert, or bitrate is over the maxBitrate (default 2500), mark as processing and send response to user
            if(upload.fileType == 'convert' || bitrate > maxBitrate){
              upload.status = 'processing';
              await upload.save();

              // set upload progress as 1 so it has something to show on the frontend
              redisClient.setAsync(`${uniqueTag}uploadProgress`, 'Your upload is beginning processing...');

              if(!responseSent){
                responseSent = true;
                aboutToProcess(res, channelUrl, uniqueTag);
              }
            }

            /** CONVERT AND UPLOAD VIDEO IF NECESSARY **/

            await ffmpegHelper.takeAndUploadThumbnail(fileInDirectory, uniqueTag, upload, channelUrl, b2, hostFilePath, bucket);

            uploadLogger.info('Captured thumbnail', logObject);

            const savePath = `${saveAndServeFilesDirectory}/${channelUrl}/${uniqueTag}.mp4`;

            // TODO: savePath and fileInDirectory are the same thing, need to clean this code up

            if(fileExtension == '.mp4' && bitrate > maxBitrate || specificMatches){
              await fs.move(savePath, `${saveAndServeFilesDirectory}/${channelUrl}/${uniqueTag}-old.mp4`);

              fileInDirectory = `${saveAndServeFilesDirectory}/${channelUrl}/${uniqueTag}-old.mp4`;
            }

            // if the file type is convert or it's over max bitrate
            if(upload.fileType == 'convert' || (bitrate > maxBitrate && fileExtension == '.mp4')){

              console.log(fileInDirectory);

              await ffmpegHelper.convertVideo({
                uploadedPath: fileInDirectory,
                title,
                bitrate,
                savePath,
                uniqueTag
              });

              uploadLogger.info('Finished converting file', logObject);

              // assuming an mp4 is created at this point so we delete the old uncoverted video
              await fs.remove(`${fileInDirectory}`);

              uploadLogger.info('Deleted unconverted file', logObject);

              // for upload to b2
              // TODO: this is kind of ugly how since it's the same variable name (as the above variable which points towards the old video)
              fileInDirectory = `${channelUrlFolder}/${uniqueTag}.mp4`;

              // Save file size after compression.
              const response = await ffmpegHelper.ffprobePromise(fileInDirectory);
              upload.processedFileSizeInMb = bytesToMb(response.format.size);

              await upload.save();

              uploadLogger.info('Completed video conversion', logObject);
            }

            upload.fileType = 'video';

            upload = await upload.save();
          }

          /** UPLOAD IMAGE OR AUDIO **/
          if(upload.fileType == 'image' || upload.fileType == 'audio'){
            // everything is already done
          }

          /** UPLOAD TO B2 **/
          if(process.env.UPLOAD_TO_B2 == 'true'){
            // note it's at 99% so the frontend doesnt redirect yet
            redisClient.setAsync(`${uniqueTag}uploadProgress`, 99);
            await backblaze.uploadToB2(upload, fileInDirectory, hostFilePath);
          }

          await markUploadAsComplete(uniqueTag, channelUrl, user);

          uploadLogger.info('Upload marked as complete', logObject);

          updateUsersUnreadSubscriptions(user);

          uploadLogger.info('Updated subscribed users subscriptions', logObject);

          // this is admin upload for all
          alertAdminOfNewUpload(user, upload);

          uploadLogger.info('Alert admins of a new upload', logObject);

          // this is admin upload for all
          updateUsersPushNotifications(user, upload);

          uploadLogger.info('Update users push notifications', logObject);

          // user
          updateUsersEmailNotifications(user, upload, req.host);

          uploadLogger.info('Update users email notifications', logObject);

          // upload is complete, send it off to user (aboutToProcess is a misnomer here)
          if(!responseSent){
            responseSent = true;
            aboutToProcess(res, channelUrl, uniqueTag);
          }
        });

        // });
      }
    });
  } catch(err){
    console.log(err);
  }
};

/** TODO: pull into livestream **/
exports.adminUpload = async(req, res) => {

  // console.log(req.headers);
  //
  // console.log('hit');
  //
  // if(req.headers.token !== 'token'){
  //   res.status = 403;
  //   return res.send('wrong');
  // }
  //
  // const username = req.headers.username;
  // const date = req.headers.date;
  //
  // console.log(date);
  //
  // let user = await User.findOne({ channelUrl: username });
  //
  // // if you cant find the user
  // if(!user){
  //   console.log('NOT EXPECTED: NO USER');
  //   res.status(500);
  //   return res.send('wrong');
  // }
  //
  // const channelUrl = user.channelUrl;
  //
  // const title = `Livestream by ${username} at ${date}`;
  //
  // const uniqueTag = randomstring.generate(7);
  //
  // const fileExtension = '.flv';
  //
  // let upload = new Upload({
  //   uploader: user._id,
  //   title,
  //   visibility: 'public',
  //   fileType : 'video',
  //   hostUrl,
  //   fileExtension : '.flv',
  //   uniqueTag,
  //   rating: 'allAges',
  //   status: 'processing',
  //   livestreamDate : date
  //   // uploadServer
  // });
  //
  // await upload.save();
  //
  // const realFileInDirectory = `./uploads/${channelUrl}${uniqueTag}.flv`;
  //
  // let flvFile = fs.createWriteStream(realFileInDirectory);
  //
  // req.on('data', chunk => {
  //
  //   flvFile.write(chunk);
  //
  // });
  //
  // req.on('end', async function(){
  //
  //   flvFile.end();
  //
  //   const hostFilePath = `${channelUrl}/${uniqueTag}`;
  //
  //   await mkdirp.mkdirpAsync(`./uploads/${user.channelUrl}`);
  //
  //   // TODO: fix this
  //   await ffmpegHelper.takeAndUploadThumbnail(fileInDirectory, uniqueTag, upload, channelUrl, b2, hostFilePath, bucket);
  //
  //   await ffmpegHelper.takeAndUploadThumbnail(realFileInDirectory, uniqueTag, hostFilePath, bucket, upload, channelUrl, b2);
  //
  //   await ffmpegHelper.convertVideo({
  //     uploadedPath: realFileInDirectory,
  //     uniqueTag,
  //     channelUrl,
  //     title: upload.title
  //   });
  //
  //   const response = await ffmpegHelper.ffprobePromise(realFileInDirectory);
  //
  //   // console.log(response);
  //
  //   upload.fileSize = response.format.size;
  //   upload.processedFileSizeInMb = bytesToMb(response.format.size);
  //
  //   upload.bitrate = response.format.bit_rate / 1000;
  //
  //   upload.status = 'completed';
  //   upload.fileType = 'video';
  //
  //   upload = await upload.save();
  //
  //   console.log('done');
  //
  //   await markUploadAsComplete(uniqueTag, channelUrl, user);
  //
  //   res.send('done');
  //
  //   updateUsersUnreadSubscriptions(user);
  //
  //   /** UPLOAD TO B2 **/
  //   if(process.env.NODE_ENV == 'production'){
  //     uploadToB2(upload, realFileInDirectory, hostFilePath);
  //   }
  // });

};
