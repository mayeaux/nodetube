
// functionality to update user to reflect plus capabalities
async function grantUserPlus(user, customerId){
  user.privs.uploadSize= 2000;
  user.privs.privateUpload = true;
  user.privs.unlistedUpload = true;
  user.privs.livestreaming = true;
  // user.privs.youtubeBackup = true;
  user.plan = 'plus';
  user.stripeCustomerId = customerId;
  await user.save();
  return user
}

// function to remove user plus functionality and make them a free usere
async function revokeUserPlus(user){
  user.privs.uploadSize = 500;
  user.privs.privateUpload = false;
  user.privs.unlistedUpload = false;
  user.privs.youtubeBackup = false;
  user.plan = 'free';
  await user.save();
  return user;
}

module.exports = {
  grantUserPlus,
  revokeUserPlus,
};
