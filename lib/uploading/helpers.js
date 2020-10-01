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

async function markConvertAsComplete(uniqueTag, channelUrl, user, res){
  // upload = await Upload.findOne({ uniqueTag });
  // upload.status = 'completed';

  // upload.processingCompletedAt = new Date();

  // await upload.save();
  console.log("quality converted")

  // user.uploads.push(upload._id);
  // await user.save();

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

function userCanUploadContentOfThisRating(maxRatingAllowed, contentRating) {
  switch (maxRatingAllowed) {
    case 'SFW':
      if (contentRating === 'mature' || contentRating === 'sensitive') {
        return false;
      }
    case 'NSFW':
      if (contentRating === 'sensitive') {
        return false
      }
    case 'SENSITIVE':
      return true
    default:
      return true
  }
}

// TODO: need an explanation of this math
const bytesToMb = (bytes, decimalPlaces = 4) => {
  return(bytes / Math.pow(10,6)).toFixed(decimalPlaces);
};

const bytesToGb = (bytes, decimalPlaces = 4) => {
  return(bytes / Math.pow(10,9)).toFixed(decimalPlaces);
};

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

module.exports = {
  markUploadAsComplete,
  markConvertAsComplete,
  updateUsersUnreadSubscriptions,
  runTimeoutFunction,
  userCanUploadContentOfThisRating,
  bytesToMb,
  bytesToGb
};


