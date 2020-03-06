const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;

const Subscription = require('../../models/index').Subscription;

// can't we just pass the upload, why have to hit the db?
async function markUploadAsComplete(uniqueTag, channelUrl, user, res){
  upload = await Upload.findOne({ uniqueTag });
  upload.status = 'completed';

  upload.processingCompletedAt = new Date();

  await upload.save();

  user.uploads.push(upload._id);
  await user.save();

  return 'success'
}

async function updateUsersUnreadSubscriptions(user){
  const subscriptions = await Subscription.find({ subscribedToUser: user._id, active: true });

  for(const subscription of subscriptions){
    let subscribingUser = await User.findOne({ _id: subscription.subscribingUser });
    if(subscribingUser){
      subscribingUser.unseenSubscriptionUploads = subscribingUser.unseenSubscriptionUploads + 1;
      await subscribingUser.save();
    }
  }

};

// TODO: I've not found a way to make this work since it needs to have access to the responseSent variable in that function context
function runTimeoutFunction(){
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
}


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
    url: `/user/${channelUrl}/${uniqueTag}?autoplay=off`
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

const bytesToMb = (bytes, decimalPlaces = 4) => {
  return(bytes / Math.pow(10,6)).toFixed(decimalPlaces);
};

function secondsToFormattedTime(durationInSeconds){
  // Formatted time is in hh:mm:ss format with no leading zeroes.
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor(durationInSeconds % 3600 / 60);
  const seconds = Math.floor(durationInSeconds % 3600 % 60);

  const formattedTime = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // https://stackoverflow.com/questions/42879023/remove-leading-zeros-from-time-format
  const removeLeadingZeroesRegex = /^0(?:0:0?)?/;
  return formattedTime.replace(removeLeadingZeroesRegex, '');
}



module.exports = {
  markUploadAsComplete,
  updateUsersUnreadSubscriptions,
  runTimeoutFunction,
  areUploadsOff,
  testIfUserRestricted,
  aboutToProcess,
  moderationIsRequired,
  checkIfAlreadyUploaded,
  testIsFileTypeUnknown,
  bytesToMb,
  secondsToFormattedTime
};


