const Upload = require('../../models/index').Upload;
const User = require('../../models/index').User;

const Subscription = require('../../models/index').Subscription;


async function markUploadAsComplete(uniqueTag, channelUrl, user, res){
  upload = await Upload.findOne({ uniqueTag });
  upload.status = 'completed';
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

module.exports = {
  markUploadAsComplete,
  updateUsersUnreadSubscriptions
};


