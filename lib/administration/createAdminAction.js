const mongoose = require('mongoose');
const AdminAction = require('../../models/index.js').AdminAction;

// const adminActions  = ['userDeleted', 'uploadDeleted', 'fullIpDeletion'];


async function createAdminAction(adminOrModerator, actionType, usersAffected, uploadsAffected, siteVisitorsAffected){
  let adminAction = new AdminAction({
    adminOrModerator,
    actionType,
    usersAffected,
    uploadsAffected,
    siteVisitorsAffected
  });

  await adminAction.save();
}

module.exports = createAdminAction;