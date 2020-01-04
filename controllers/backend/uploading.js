const Promise = require('bluebird');
var concat = require('concat-files');
var B2 = require('easy-backblaze');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const mkdirp = Promise.promisifyAll(require('mkdirp'));
var randomstring = require('randomstring');

const redisClient = require('../../config/redis');

const pagination = require('../../lib/helpers/pagination');

const User = require('../../models/index').User;
const Upload = require('../../models/index').Upload;
const Comment = require('../../models/index').Comment;
const View = require('../../models/index').View;
const SiteVisit = require('../../models/index').SiteVisit;
const React = require('../../models/index').React;
const Notification = require('../../models/index').Notification;
const SocialPost = require('../../models/index').SocialPost;
const Subscription = require('../../models/index').Subscription;

const { saveAndServeFilesDirectory } = require('../../lib/helpers/settings');
const getMediaType = require('../../lib/uploading/media');
const { b2, bucket, hostUrl } = require('../../lib/uploading/backblaze');

const mongooseHelpers = require('../../caching/mongooseHelpers');
const ffmpegHelper = require('../../lib/uploading/ffmpeg');
const uploadHelpers = require('../../lib/uploading/helpers');
const backblaze = require('../../lib/uploading/backblaze');

console.log(`SAVE AND SERVE FILES DIRECTORY: ${saveAndServeFilesDirectory}`);

var resumable = require('../../lib/uploading/resumable.js')(__dirname +  '/upload');

const winston = require('winston');
const uploadsOn = process.env.UPLOADS_ON;

console.log(uploadsOn + ' uploads on');

//
// Grab your preconfigured logger
//
const uploadLogger = winston.loggers.get('uploadEndpoint');

/**
 * POST /api/upload
 * File Upload API example.
 */
exports.postFileUpload = async(req, res, next) => {

  try {

    // if uploads are off and user not auto allowed
    if(uploadsOn == 'false' && !req.user.privs.autoVisibleUpload){
      console.log('HERE');
      res.status(500);
      return res.send({ message: 'UPLOADS_OFF'});
    }

    let logObject = {
      user: req.user.channelUrl,
      upload: req.query.title
    };

    // res.setHeader('Access-Control-Allow-Origin', '*');

    // console.log(req.query.uploadToken);

    // if there is no user on the request, get it from the req query
    if(!req.user && req.query.uploadToken){
      req.user = await User.findOne({uploadToken: req.query.uploadToken});
    }

    // console.log(`REQUESTED BY : ${req.user.channelName}`);

    if(req.user.status == 'uploadRestricted'){
      uploadLogger.info('User upload status restricted', logObject);

      res.status(403);
      return res.send('Sorry your account is restricted');
    }

    // TODO: File size check

    if(req.user.status == 'restricted'){
      uploadLogger.info('User status restricted', logObject);
      res.status(403);
      return res.send('Sorry uploads are halted');
    }

    let restrictUntrustedUploads = process.env.RESTRICT_UNTRUSTED_UPLOADS || false;
    // force to boolean
    restrictUntrustedUploads = ( restrictUntrustedUploads == 'true' );

    const userIsUntrusted = !req.user.privs.autoVisibleUpload;

    const requireModeration = restrictUntrustedUploads && userIsUntrusted;

    const user = req.user;

    // TODO: add a better check here
    const alreadyUploaded = await Upload.findOne({
      uploader: req.user._id,
      title: req.query.title,
      visibility: 'public',
      $or : [ { status: 'completed' }, { uploadUrl: { $exists: true } } ]
    });

    if(alreadyUploaded){
      uploadLogger.info('Upload title already uploaded', logObject);
      res.status(500);
      return res.send({message: 'ALREADY-UPLOADED'});
    }

    /** WHEN A NEW CHUNK IS COMPLETED **/
    resumable.post(req, async function(status, filename, original_filename, identifier){
      // console.log(req.query);

      const chunkNumber = req.query.resumableChunkNumber;
      const totalChunks = req.query.resumableTotalChunks;

      uploadLogger.info(`Processing chunk number ${chunkNumber} of ${totalChunks} `, logObject);

      const fileSize = req.body.resumableTotalSize;
      const fileName = filename;

      const fileType = getMediaType(filename);
      let fileExtension = path.extname(filename);

      if(fileExtension == '.MP4'){
        fileExtension = '.mp4';
      }

      /** RESPOND EARLY IF ITS AN UNKNOWN FILE TYPE **/
      if(fileType == 'unknown'){
        let upload = new Upload({
          uploader: req.user._id,
          title: req.query.title,
          description: req.query.description,
          visibility: req.query.visibility,
          originalFileName: fileName,
          fileType,
          hostUrl,
          fileExtension,
          fileSize,
          status: 'rejected'
        });

        await upload.save();

        logObject.uploadExtension = fileExtension;
        uploadLogger.info('Unknown file type', logObject);

        res.status(500);
        return res.send({message: 'UNKNOWN FILETYPE'});
      }

      let uploadPath = `./upload/${identifier}`;

      /** FINISHED DOWNLOADING EVERYTHING **/
      if(req.body.resumableChunkNumber == req.body.resumableTotalChunks){

        const channelUrl = req.user.channelUrl;
        const uniqueTag = randomstring.generate(7);

        const hostFilePath = `${channelUrl}/${uniqueTag}`;
        // const uploadServer = process.env.UPLOAD_SERVER || 'uploads1' ;
        let responseSent = false;

        let category = req.query.category;
        if(category == 'undefined' || category == undefined){
          category = 'uncategorized';
        }

        let subcategory = req.query.subcategory;
        if(subcategory == 'undefined' || subcategory == undefined){
          subcategory = 'uncategorized';
        }

        let uploadObject = {
          uploader: req.user._id,
          title: req.query.title,
          description: req.query.description,
          visibility: req.query.visibility,
          originalFileName: fileName,
          fileType,
          hostUrl,
          fileExtension,
          uniqueTag,
          rating: req.query.rating,
          category,
          subcategory
          // uploadServer
        };

        let upload = new Upload(uploadObject);

        if(requireModeration){
          upload.visibility = 'pending';
        }

        await upload.save();

        uploadLogger.info('Upload document added to db', Object.assign({}, logObject, uploadObject));

        /** FILE PROCESSING */

        // say it's processing if it's 25+ seconds
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
              res.send({
                message: 'ABOUT TO PROCESS',
                url: `/user/${channelUrl}/${uniqueTag}`
              });
            }
          }
        })();

        // turn filenames into an array for concatenation
        const fileNameArray = [];
        for(var x = 1; x < parseInt(req.body.resumableTotalChunks, 10) + 1; x++){
          fileNameArray.push(`${uploadPath}/${x}`);
        }

        /** CONCATENATE FILES AND BEGIN PROCESSING **/
        concat(fileNameArray, `${uploadPath}/convertedFile`, async function(err){
          if(err)throw err;

          let bitrate;

          uploadLogger.info('Concat done', logObject);

          // calculate bitrate for video, audio and converts
          if(fileType == 'video' || fileType == 'audio' || fileType == 'convert'){
            const response = await ffmpegHelper.ffprobePromise(`${uploadPath}/convertedFile`);

            bitrate = response.format.bit_rate / 1000;

            uploadLogger.info(`BITRATE: ${response.format.bit_rate / 1000}`, logObject);

            if(bitrate > 2500){
              // console.log('need to convert here')
            }
          }

          // where to save the files
          const channelUrlFolder = `${saveAndServeFilesDirectory}/${user.channelUrl}`;

          console.log(channelUrlFolder + ' channel url folder');

          // make user's folder if it doesn't exist yet
          await mkdirp.mkdirpAsync(channelUrlFolder);

          // file name to save
          const fileName = `${uniqueTag}${fileExtension}`;

          // where the file will be served from
          let fileInDirectory = `${channelUrlFolder}/${fileName}`;

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

          /** CONVERT AND UPLOAD VIDEO **/
          if(upload.fileType == 'convert'){
            await ffmpegHelper.takeAndUploadThumbnail(fileInDirectory, uniqueTag, hostFilePath, bucket, upload, channelUrl, b2);

            uploadLogger.info('Captured thumbnail', logObject);

            // TODO: we're compressing the upload as we convert it, may want to convert and then compress and keep both (lose best quality as is)
            await ffmpegHelper.convertVideo({
              uploadedPath: fileInDirectory,
              uniqueTag,
              channelUrl,
              title: upload.title,
              bitrate
            });

            uploadLogger.info('Finished converting file', logObject);

            // assuming an mp4 is created at this point
            await fs.remove(`${fileInDirectory}`);

            uploadLogger.info('Deleted unconverted file', logObject);

            // for upload to b2
            fileInDirectory = `${channelUrlFolder}/${uniqueTag}.mp4`;

            upload.status = 'completed';
            upload.fileType = 'video';

            upload = await upload.save();

            uploadLogger.info('Completed video conversion', logObject);

          }

          /** UPLOAD VIDEO AND CONVERT IF NEEDED **/
          if(upload.fileExtension == '.mp4' || upload.fileExtension == '.MP4'){
            await ffmpegHelper.takeAndUploadThumbnail(fileInDirectory, uniqueTag, hostFilePath, bucket, upload, channelUrl, b2);

            if(bitrate > 2500){

              uploadLogger.info('About to compress file since bitrate is over 2500', logObject);

              (async function(){

                await ffmpegHelper.compressVideo({
                  uploadedPath: fileInDirectory,
                  uniqueTag,
                  channelUrl,
                  title: upload.title
                });

                uploadLogger.info('Video file is compressed', logObject);

                // mark original upload file as high quality file
                await fs.move(fileInDirectory, `${channelUrlFolder}/${uniqueTag}-high.mp4`);

                uploadLogger.info('Moved original filename to uniqueTag-high.mp4', logObject);

                // move compressed video to original video's place
                await fs.move(`${channelUrlFolder}/${uniqueTag}-compressed.mp4`, fileInDirectory);

                uploadLogger.info('Moved compressed file to default uniqueTag.mp4 location', logObject);

                // save high quality video size
                const highQualityFileStats = fs.statSync(`${channelUrlFolder}/${uniqueTag}-high.mp4`);
                upload.quality.high = highQualityFileStats.size;

                // save compressed video quality size
                const compressedFileStats = fs.statSync(fileInDirectory);
                upload.fileSize = compressedFileStats.size;

                // uploadLogger.info(`Moved file to user's directory`, logObject);

                await upload.save();

                uploadLogger.info('Upload document saved after compression and moving files', logObject);

              })();
            }

          }

          /** UPLOAD IMAGE OR AUDIO **/
          if(upload.fileType == 'image' || upload.fileType == 'audio'){
            // everything is already done
          }

          /** UPLOAD TO B2 **/
          if(process.env.NODE_ENV == 'production' && process.env.UPLOAD_TO_B2 == 'true'){
            await backblaze.uploadToB2(upload, fileInDirectory, hostFilePath);
          }

          await uploadHelpers.markUploadAsComplete(uniqueTag, channelUrl, user);

          uploadLogger.info('Upload marked as complete', logObject);

          uploadHelpers.updateUsersUnreadSubscriptions(user);

          uploadLogger.info('Updated subscribed users subscriptions', logObject);

          if(!responseSent)
          {
            responseSent = true;
            res.send({
              message: 'DONE PROCESSING',
              url: `/user/${channelUrl}/${uniqueTag}?autoplay=off`
            });
          }
        });
      } else {
        res.send(status);
      }

    });

  } catch(err){
    console.log(err);
  }

};

/** TODO: pull into livestream **/
exports.adminUpload = async(req, res) => {

  console.log(req.headers);

  console.log('hit');

  if(req.headers.token !== 'token'){
    res.status = 403;
    return res.send('wrong');
  }

  const username = req.headers.username;
  const date = req.headers.date;

  console.log(date);

  let user = await User.findOne({ channelUrl: username });

  // if you cant find the user
  if(!user){
    console.log('NOT EXPECTED: NO USER');
    res.status(500);
    return res.send('wrong');
  }

  const channelUrl = user.channelUrl;

  const title = `Livestream by ${username} at ${date}`;

  const uniqueTag = randomstring.generate(7);

  const fileExtension = '.flv';

  let upload = new Upload({
    uploader: user._id,
    title,
    visibility: 'public',
    fileType : 'video',
    hostUrl,
    fileExtension : '.flv',
    uniqueTag,
    rating: 'allAges',
    status: 'processing',
    livestreamDate : date
    // uploadServer
  });

  await upload.save();

  const realFileInDirectory = `./uploads/${channelUrl}${uniqueTag}.flv`;

  let flvFile = fs.createWriteStream(realFileInDirectory);

  req.on('data', chunk => {

    flvFile.write(chunk);

  });

  req.on('end', async function(){

    flvFile.end();

    const hostFilePath = `${channelUrl}/${uniqueTag}`;

    await mkdirp.mkdirpAsync(`./uploads/${user.channelUrl}`);

    await ffmpegHelper.takeAndUploadThumbnail(realFileInDirectory, uniqueTag, hostFilePath, bucket, upload, channelUrl, b2);

    await ffmpegHelper.convertVideo({
      uploadedPath: realFileInDirectory,
      uniqueTag,
      channelUrl,
      title: upload.title
    });

    const response = await ffmpegHelper.ffprobePromise(realFileInDirectory);

    // console.log(response);

    upload.fileSize = response.format.size;

    upload.bitrate = response.format.bit_rate / 1000;

    upload.status = 'completed';
    upload.fileType = 'video';

    upload = await upload.save();

    console.log('done');

    await markUploadAsComplete(uniqueTag, channelUrl, user);

    res.send('done');

    updateUsersUnreadSubscriptions(user);

    /** UPLOAD TO B2 **/
    if(process.env.NODE_ENV == 'production'){
      uploadToB2(upload, realFileInDirectory, hostFilePath);
    }
  });

};
