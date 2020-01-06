var fs = require('fs');
var B2 = require('easy-backblaze');
const _ = require('lodash');
const Promise = require('bluebird')


const hostUrl = process.env.BACKBLAZE_HOST_URL;
const accountId = process.env.BACKBLAZE_ACCOUNT_ID;
const applicationKey = process.env.BACKBLAZE_APP_KEY;
const bucket = process.env.BACKBLAZE_BUCKET;
var b2 = Promise.promisifyAll(new B2(accountId, applicationKey));


async function uploadToB2(upload, uploadPath, hostFilePath){

  console.log('upload to b2');

  if(upload.fileType == 'video'){
    upload.fileExtension = '.mp4'
  }

  const response = await b2.uploadFileAsync(uploadPath, {
    name: hostFilePath + upload.fileExtension,
    bucket // Optional, defaults to first bucket
  });

  upload.uploadUrl = response;

  await upload.save();

  console.log(response);
}


// async function uploadFile(file, creator, fileName){
//   const authResponse = await b2.authorize();
//   const getUploadUrl = await b2.getUploadUrl(bucketId);
//
//   // upload file
//   const uploadResponse = await b2.uploadFile({
//     uploadUrl: getUploadUrl.data.uploadUrl,
//     uploadAuthToken: getUploadUrl.data.authorizationToken,
//     filename: `${creator}/${fileName}`,
//     data: file
//   });
//
//   return uploadResponse;
// }
//
// async function listFiles(){
//   const authResponse = await b2.authorize();
//
//   // var response = await b2.listBuckets()
//   //
//   // console.log(response.data);
//
//   // list file names
//   const response = await b2.listFileNames({
//     bucketId,
//   });
//
//   const files = response.data.files;
//
//   let updatedFiles = [];
//
//   for(file of files){
//
//     let fileName, user;
//
//     const split = file.fileName.split('/');
//     if(split.length > 1){
//       user = split[0];
//       fileName = split[1];
//
//       file.user = user;
//       file.fileName = fileName;
//       updatedFiles.push(file);
//
//     }
//   }
//
//   const sortedObject = _.groupBy(updatedFiles, 'user')
//
//   console.log(sortedObject);
//
//   return sortedObject
//
// }
//
// listFiles().catch(function(err) {
//   console.log(err)
// })


async function uploadUserThumbnailToB2(userChannelUrl, fileExtension){
  console.log('Uploading user upload thumbnail to b2');
  /** UPLOAD THUMBNAIL **/
    const response = await b2.uploadFileAsync(`./uploads/${userChannelUrl}/user-thumbnail${fileExtension}`, {
      name: `${userChannelUrl}/user-thumbnail${fileExtension}`,
      bucket // Optional, defaults to first bucket
    });

  console.log(response);
}

async function editploadThumbnailToB2(channelUrl, uniqueTag, fileExtension, upload){
    console.log('Uploading custom file thumbnail to b2');
    /** UPLOAD THUMBNAIL **/
    const response =
      await b2.uploadFileAsync(`./uploads/${channelUrl}/${uniqueTag}-custom${fileExtension}`, {
        name: `${channelUrl}/${uniqueTag}-custom${fileExtension}`,
        bucket // Optional, defaults to first bucket
      });


  console.log(`UPLOADED TO BACKBLAZE : ${response}`);

  upload.customThumbnailUrl = response;

    await upload.save();
}

module.exports = {
  // uploadFile,
  uploadToB2,
  uploadUserThumbnailToB2,
  editploadThumbnailToB2,
  b2,
  bucket,
  hostUrl
};

