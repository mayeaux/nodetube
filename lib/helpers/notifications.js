const Notification = require('../../models/index').Notification;
const pug = require('pug');

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

  return notification;
}

function generateNotificationHtml(notification) {

  let html = pug.renderFile('views/emails/notification.pug', {
    notification,
    upload: notification.upload
  });

  console.log(html);

  return html;

}


module.exports = {
  createNotification,
  generateNotificationHtml
}