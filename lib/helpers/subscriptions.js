
// functionality to update user to reflect plus capabilities
async function grantUserPlus(user, customerId, subscription){
  user.privs.uploadSize= 2000;
  user.privs.privateUpload = true;
  user.privs.unlistedUpload = true;
  user.privs.livestreaming = true;
  // user.privs.youtubeBackup = true;
  user.plan = 'plus';

  // stripe subscription stuff
  user.stripeCustomerId = customerId;
  user.stripeSubscriptionId = subscription.id;
  user.stripeSubscriptionCreationDate = new Date();
  user.stripeSubscriptionRenewalDate = new Date(subscription.current_period_end * 1000);

  user.stripeSubscriptionCancelled = undefined;
  user.stripeSubscriptionCancellationDate =  undefined;

  await user.save();
  return user
}

// function to remove user plus functionality and make them a free usere
async function revokeUserPlus(user){
  user.privs.uploadSize = 500;
  user.privs.privateUpload = false;
  user.privs.unlistedUpload = false;
  user.privs.youtubeBackup = false;
  user.privs.livestreaming = false;
  user.plan = 'free';
  await user.save();
  return user;
}

module.exports = {
  grantUserPlus,
  revokeUserPlus,
};
