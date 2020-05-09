/** uploadServer should either land as /uploads (local) or https://domain.com/uploads (remote) **/
/** this allows you to point to another server as the path for uploads **/
let uploadServer;
// not production and no upload server, serve from /uploads path
if(process.env.NODE_ENV !== 'production' && !process.env.UPLOAD_SERVER){
  uploadServer = '/uploads';


// not production but an upload server, use the upload server
} else if (process.env.NODE_ENV !== 'production' && process.env.UPLOAD_SERVER){
  uploadServer = process.env.UPLOAD_SERVER;

// TODO: not really necessary it's the same logic as above
} else if (process.env.NODE_ENV == 'production' && process.env.UPLOAD_SERVER){
  // otherwise load the upload's uploadServer
  uploadServer = process.env.UPLOAD_SERVER;
} else {
  uploadServer = `https://${process.env.UPLOAD_SERVER}.${process.env.DOMAIN_NAME_AND_TLD}/uploads`;
}

let uploadUrl;
if(process.env.UPLOAD_URL){
  uploadUrl = process.env.UPLOAD_URL
} else {
  uploadUrl = '/upload'
}

let saveAndServeFilesDirectory;
if(process.env.SAVE_AND_SERVE_FILES_DIRECTORY){
  saveAndServeFilesDirectory = process.env.SAVE_AND_SERVE_FILES_DIRECTORY
} else {
  saveAndServeFilesDirectory = '/uploads'
}

// console.log(`UPLOAD URL: ${process.env.UPLOAD_URL}`);

module.exports = {
  uploadServer,
  uploadUrl,
  saveAndServeFilesDirectory
};