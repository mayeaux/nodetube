async function grantUserPlus(user, customerId){
  user.privs.uploadSize= 2000;
  user.privs.privateUpload = true;
  user.privs.unlistedUpload = true;
  user.privs.youtubeBackup = true;
  user.plan = 'plus';
  user.stripeCustomerId = customerId;
  await user.save();
  return user
}

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