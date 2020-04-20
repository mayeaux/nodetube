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

  return notification;
}

function generateNotificationHtml(notification) {

  var html = `<html><head><meta charset='utf-8'><link rel='stylesheet' href='${process.env.DOMAIN_NAME_AND_TLD}/css/main.css'><link rel='stylesheet' href='${process.env.DOMAIN_NAME_AND_TLD}/css/nodetube.css'></head><body>`;

  if(notification.action == "subscription") {

    html += "<h1> New Subscriber </h1>";
    html += `<p>Hello, ${notification.upload.uploader.channelName}.<p>`;

    if(!notification.upload) {
      html += "<div><b>A user has subscribed to your channel from your channel page.</b>";
      html += `<br><small>${notification.timeAgo}</small></div>`
    } else {
      html += `<div><b>A user has subscribed to your channel from your ${upload.fileType}.</b>`
      html += `<br><small>${notification.timeAgo}</small></div>`

      var src;
      if(notification.upload.thumbnails && notification.upload.thumbnails.custom)
        src = `${process.env.DOMAIN_NAME_AND_TLD}/${uploadServer}/${channelUrl || upload.uploader.channelUrl}/${upload.thumbnails.custom}`;
      else if(notification.upload.fileType == "video" && notification.upload.thumbnails && notification.upload.thumbnails.generated)
        src = `${process.env.DOMAIN_NAME_AND_TLD}/${uploadServer}/${channelUrl || upload.uploader.channelUrl}/${upload.thumbnails.generated}`;
      else if(notification.upload.fileType == "video" && notification.upload.thumbnails && notification.upload.thumbnails.medium)
        src = `${process.env.DOMAIN_NAME_AND_TLD}/${uploadServer}/${channelUrl || upload.uploader.channelUrl}/${upload.thumbnails.medium}`;
      else if(notification.upload.fileType == "video" && !notification.upload.thumbnailUrl)
        src = `${process.env.DOMAIN_NAME_AND_TLD}/images/no_img.png`;
      else if(notification.upload.fileType == "image")
        src = `${uploadServer}/${channelUrl|| upload.uploader.channelUrl }/${upload.uniqueTag}${upload.fileExtension}`;
      else if(notification.upload.fileType == "audio")
        src = `${process.env.DOMAIN_NAME_AND_TLD}/images/audio.svg`;
      else if(notification.upload.fileType == "unknown")
        src = `${process.env.DOMAIN_NAME_AND_TLD}/images/no_img.png`;

      html += "<div class='col-xs-12 col-sm-6 col-md-6 col-lg-4' style='text-align: center; height: 353px;'>";
      html += `<a class='title-anchor' href='${process.env.DOMAIN_NAME_AND_TLD}/user/${notification.upload.uploader.channelUrl}/${notification.upload.uniqueTag}' style='color: black'>`;
      html += `<img class='preview-image' src='${src}' style=''></a>`;
      html += `<a class='title-anchor' href='${process.env.DOMAIN_NAME_AND_TLD}/user/${notification.upload.uploader.channelUrl}/${notification.upload.uniqueTag}' style='color: black'>`;  
      html += `<div><p class='balance-text upload-title-text' style='width:100%;margin:0 auto;margin-top:11px;margin-bottom:7px;'>${notification.upload.title}</p></div></a>`;

    }

    html += "<p>Congratulations, keep growing!</p>";

  } else if(notification.action == "comment") {

    html += "<h1> New Comment </h1>";
    html += `<p>Hello, ${notification.upload.uploader.channelName}.<p>`;

    if(!notification.comment.inResponseTo)
      html += `<div><b>${notification.sender.channelName || notification.sender.channelUrl} has commented \"${notification.comment.text}\" on your ${notification.upload.fileType}.</b>`;
    else
      html += `<div><b>${notification.sender.channelName || notification.sender.channelUrl} has responded \"${notification.comment.text}\" to your comment on the ${notification.upload.fileType}.</b>`;

    html += `<br><small>${notification.timeAgo}</small></div>`

    var src;
    if(notification.upload.thumbnails && notification.upload.thumbnails.custom)
      src = `${process.env.DOMAIN_NAME_AND_TLD}/${uploadServer}/${channelUrl || upload.uploader.channelUrl}/${upload.thumbnails.custom}`;
    else if(notification.upload.fileType == "video" && notification.upload.thumbnails && notification.upload.thumbnails.generated)
      src = `${process.env.DOMAIN_NAME_AND_TLD}/${uploadServer}/${channelUrl || upload.uploader.channelUrl}/${upload.thumbnails.generated}`;
    else if(notification.upload.fileType == "video" && notification.upload.thumbnails && notification.upload.thumbnails.medium)
      src = `${process.env.DOMAIN_NAME_AND_TLD}/${uploadServer}/${channelUrl || upload.uploader.channelUrl}/${upload.thumbnails.medium}`;
    else if(notification.upload.fileType == "video" && !notification.upload.thumbnailUrl)
      src = `${process.env.DOMAIN_NAME_AND_TLD}/images/no_img.png`;
    else if(notification.upload.fileType == "image")
      src = `${uploadServer}/${channelUrl|| upload.uploader.channelUrl }/${upload.uniqueTag}${upload.fileExtension}`;
    else if(notification.upload.fileType == "audio")
      src = `${process.env.DOMAIN_NAME_AND_TLD}/images/audio.svg`;
    else if(notification.upload.fileType == "unknown")
      src = `${process.env.DOMAIN_NAME_AND_TLD}/images/no_img.png`;

    html += "<div class='col-xs-12 col-sm-6 col-md-6 col-lg-4' style='text-align: center; height: 353px;'>";
    html += `<a class='title-anchor' href='${process.env.DOMAIN_NAME_AND_TLD}/user/${notification.upload.uploader.channelUrl}/${notification.upload.uniqueTag}' style='color: black'>`;
    html += `<img class='preview-image' src='${src}' style=''></a>`;
    html += `<a class='title-anchor' href='${process.env.DOMAIN_NAME_AND_TLD}/user/${notification.upload.uploader.channelUrl}/${notification.upload.uniqueTag}' style='color: black'>`;  
    html += `<div><p class='balance-text upload-title-text' style='width:100%;margin:0 auto;margin-top:11px;margin-bottom:7px;'>${notification.upload.title}</p></div></a>`;
  } else if(notification.action == "react") {
    html += `<div><b>A user has reacted with a ${notification.react.react} to your ${notification.upload.fileType}.</b>`;
    html += `<br><small>${notification.timeAgo}</small></div>`

    var src;
    if(notification.upload.thumbnails && notification.upload.thumbnails.custom)
      src = `${process.env.DOMAIN_NAME_AND_TLD}${process.env.UPLOAD_SERVER}/${notification.upload.uploader.channelUrl}/${notification.upload.thumbnails.custom}`;
    else if(notification.upload.fileType == "video" && notification.upload.thumbnails && notification.upload.thumbnails.generated)
      src = `${process.env.DOMAIN_NAME_AND_TLD}${process.env.UPLOAD_SERVER}/${notification.upload.uploader.channelUrl}/${notification.upload.thumbnails.generated}`;
    else if(notification.upload.fileType == "video" && notification.upload.thumbnails && notification.upload.thumbnails.medium)
      src = `${process.env.DOMAIN_NAME_AND_TLD}${process.env.UPLOAD_SERVER}/${notification.upload.uploader.channelUrl}/${notification.upload.thumbnails.medium}`;
    else if(notification.upload.fileType == "video" && !notification.upload.thumbnailUrl)
      src = `${process.env.DOMAIN_NAME_AND_TLD}/images/no_img.png`;
    else if(notification.upload.fileType == "image")
      src = `${process.env.DOMAIN_NAME_AND_TLD}${process.env.UPLOAD_SERVER}/${notification.upload.uploader.channelUrl }/${notification.upload.uniqueTag}${notification.upload.fileExtension}`;
    else if(notification.upload.fileType == "audio")
      src = `${process.env.DOMAIN_NAME_AND_TLD}/images/audio.svg`;
    else if(notification.upload.fileType == "unknown")
      src = `${process.env.DOMAIN_NAME_AND_TLD}/images/no_img.png`;

    html += "<div class='col-xs-12 col-sm-6 col-md-6 col-lg-4' style='text-align: center; height: 353px;'>";
    html += `<a class='title-anchor' href='${process.env.DOMAIN_NAME_AND_TLD}/user/${notification.upload.uploader.channelUrl}/${notification.upload.uniqueTag}' style='color: black'>`;
    html += `<img class='preview-image' src='${src}' style=''></a>`;
    html += `<a class='title-anchor' href='${process.env.DOMAIN_NAME_AND_TLD}/user/${notification.upload.uploader.channelUrl}/${notification.upload.uniqueTag}' style='color: black'>`;  
    html += `<div><p class='balance-text upload-title-text' style='width:100%;margin:0 auto;margin-top:11px;margin-bottom:7px;'>${notification.upload.title}</p></div></a>`;
  }

  html += `<p>Best regards,<br><b>${process.env.INSTANCE_BRAND_NAME}</b>.</p></body></html>`;

  return html;

}


module.exports = {
  createNotification,
  generateNotificationHtml
}