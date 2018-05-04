const mongoose = require('mongoose');
const AdminAction = require('../../models/index.js').AdminAction;

// const adminActions  = ['userDeleted', 'uploadDeleted', 'fullIpDeletion'];


// 7 arguments
async function createAdminAction(adminOrModerator, actionType, usersAffected, uploadsAffected, commentsAffected,
                                 siteVisitorsAffected, data){
  let adminAction = new AdminAction({
    adminOrModerator,
    actionType,
    usersAffected,
    uploadsAffected,
    commentsAffected,
    siteVisitorsAffected,
    data
  });

  await adminAction.save();
}

module.exports = createAdminAction;