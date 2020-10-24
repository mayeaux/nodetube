async function addValuesIfNecessary(upload, channelUrl){
  if(upload.fileType == 'video' || upload.fileType == 'audio'){
    if(!upload.durationInSeconds || !upload.formattedDuration){

      var server = uploadServer;
      if(server.charAt(0) == '/') // the slash confuses the file reading, because host root directory is not the same as machine root directory
        server = server.substr(1);

      const uploadLocation = `${server}/${channelUrl}/${upload.uniqueTag + upload.fileExtension}`;

      try {
        const duration = await getUploadDuration(uploadLocation, upload.fileType);
        console.log(duration);

        let uploadDocument = await Upload.findOne({uniqueTag: upload.uniqueTag});

        uploadDocument.durationInSeconds = duration.seconds;
        uploadDocument.formattedDuration = duration.formattedTime;

        await uploadDocument.save();

      } catch(err){
        /** if the file has been deleted then it won't blow up **/
        // console.log(err);
      }
      // console.log('have to add');
    }
  }
}


module.exports = addValuesIfNecessary;