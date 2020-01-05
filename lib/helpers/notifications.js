const Notification = require('../../models/index').Notification;

async function createNotification(user, sender, action, upload, react, comment){



  const notification = new Notification({
    user,
    sender,
    action,
    upload,
    react,
    comment
  });

  await notification.save();

  console.log('created notification');
}


module.exports = createNotification