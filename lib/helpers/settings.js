let uploadServer;
// development with no upload server
if(process.env.NODE_ENV !== 'production' && !process.env.UPLOAD_SERVER){
  uploadServer = '/uploads';
// development with an upload server
} else if (process.env.NODE_ENV !== 'production' && process.env.UPLOAD_SERVER){
  // otherwise load the upload's uploadServer
  uploadServer = process.env.UPLOAD_SERVER;
} else if (process.env.NODE_ENV == 'production' && process.env.UPLOAD_SERVER){
  // otherwise load the upload's uploadServer
  uploadServer = process.env.UPLOAD_SERVER;
} else {
  uploadServer = `https://${process.env.UPLOAD_SERVER}.pew.tube/uploads`;
}

let uploadUrl;
if(process.env.UPLOAD_URL){
  uploadUrl = process.env.UPLOAD_URL
} else {
  uploadUrl = '/upload'
}

module.exports = {
  uploadServer,
  uploadUrl
};