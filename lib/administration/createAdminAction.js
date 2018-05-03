const mongoose = require('mongoose');
const AdminAction = require('../../models/index.js').AdminAction;

// const adminActions  = ['userDeleted', 'uploadDeleted', 'fullIpDeletion'];


async function createAdminAction(adminOrModerator, actionType, usersAffected, uploadsAffected, commentsAffected, siteVisitorsAffected){
  let adminAction = new AdminAction({
    adminOrModerator,
    actionType,
    usersAffected,
    uploadsAffected,
    commentsAffected,
    siteVisitorsAffected
  });

  await adminAction.save();
}

module.exports = createAdminAction;