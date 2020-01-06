const User = require('../../models/index.js').User;
const SiteVisit = require('../../models/index.js').SiteVisit;
const Upload = require('../../models/index.js').Upload;
const Comment = require('../../models/index.js').Comment;

function remove_duplicates_es6(arr) {
  let s = new Set(arr);
  let it = s.values();
  return Array.from(it);
}


async function getUsersAndSiteVisitAmount(channelUrl){
  let allFoundUsers = [];
  let allSiteVisits = [];

  // find the user
  /** find user **/
  const user = await User.findOne({ channelUrl });

  // console.log(user);

  /** find all sitevisits for user **/
  const sitevisits = await SiteVisit.find({ user: user._id });

  // console.log(sitevisits.length);

  /** loop through all sitevisits of user **/
  for(let sitevisit of sitevisits){
    // console.log(sitevisit.ip);

    /** find all sitevisits for that ip **/



    const newSiteVisits = await SiteVisit.find({ ip : sitevisit.ip });

    for(let newSiteVisit of newSiteVisits){
      allSiteVisits.push(newSiteVisit);
    }

    // console.log(newSiteVisits);
    //
    // console.log(newSiteVisits.length);

    /** find all users for the sitevisits attached to that ip **/
    for(let newsitevisit of newSiteVisits){
      if(newsitevisit.user){
        let newUser = await User.findOne({ _id: newsitevisit.user });

        if(newUser){
          allFoundUsers.push(newUser)
        }

        // console.log(newUser)
      }
      // console.log(newsitevisit.user);
    }


  }

  let foundUserNames = [];
  let foundSiteVisitorIds = [];


  for(let foundUser of allFoundUsers){

    foundUserNames.push(foundUser.channelUrl);
    // console.log(foundUser.channelUrl);
  }

  foundUserNames = remove_duplicates_es6(foundUserNames);

  // console.log(foundUserNames);


  // console.log(allSiteVisits);


  for(let foundSiteVisit of allSiteVisits){

    foundSiteVisitorIds.push(foundSiteVisit._id);
  }

  foundSiteVisitorIds = remove_duplicates_es6(foundSiteVisitorIds);

  // console.log(foundSiteVisitorIds);

  return {
    ids: foundSiteVisitorIds,
    channelUrls: foundUserNames
  }

}

async function deleteUsersAndBanIps(channelUrls, ids){

  for(let username of channelUrls){
    let userToDelete = await User.findOne({ channelUrl: username });
    userToDelete.status = 'restricted';
    await userToDelete.save();

    const uploads = await Upload.find({ uploader: userToDelete._id });

    const comments = await Comment.find({ commenter: userToDelete._id });

    for(let upload of uploads){
      upload.visibility = 'removed';
      await upload.save();
    }

    for(let comment of comments){
      comment.visibility = 'removed';
      await comment.save();
    }
  }

  for(let id of ids){
    // console.log(id);

    let siteVisit = await SiteVisit.findOne({ _id: id });

    // console.log(siteVisit);

    siteVisit.blocked = true;
    await siteVisit.save();
  }

  return 'success'
}

async function deleteAllUsersAndBlockIps(channelUrl){
  const { channelUrls, ids } = await getUsersAndSiteVisitAmount(channelUrl);
  console.log(channelUrls, ids);
  const response = await deleteUsersAndBanIps(channelUrls, ids);
  console.log(response)
}

// deleteAllUsersAndBlockIps('Ghost14');

module.exports = {
  getUsersAndSiteVisitAmount,
  deleteAllUsersAndBlockIps
};