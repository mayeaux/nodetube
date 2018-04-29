const mongoose = require('mongoose');
const AdminAction = require('../../models/index.js').AdminAction;

// const adminActions  = ['userDeleted', 'uploadDeleted', 'fullIpDeletion'];


async function createAdminAction(adminOrModerator, actionType, affectedUsers, affectedUploads, affectedSiteVisitors){
  let adminAction = new AdminAction({
    adminOrModerator,
    actionType,
    affectedUsers,
    affectedUploads,
    affectedSiteVisitors
  });

  await adminAction.save();
}

module.exports = createAdminAction;