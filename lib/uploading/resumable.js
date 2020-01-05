var fs = require('fs'), util = require('util'), Stream = require('stream').Stream;

const mv = require('mv');

var path = require('path');
var appDir = path.dirname(require.main.filename);

// console.log(appDir);

const uploadPath = appDir + '/upload/'

module.exports = resumable = function(temporaryFolder){
  var $ = this;
  $.temporaryFolder = temporaryFolder;
  $.maxFileSize = null;
  $.fileParameterName = 'file';

  try {
    fs.mkdirSync(uploadPath);
  }catch(e){}


  var cleanIdentifier = function(identifier){
    return identifier.replace(/^0-9A-Za-z_-/img, '');
  };

  var getChunkFilename = function(chunkNumber, identifier){
    // Clean up the identifier
    identifier = cleanIdentifier(identifier);
    // What would the file name be?

    const fullDirName = uploadPath + identifier

    if (!fs.existsSync(fullDirName)){
      fs.mkdirSync(fullDirName);
    }

    return uploadPath + identifier  + '/' + chunkNumber;

  };

  var validateRequest = function(chunkNumber, chunkSize, totalSize, identifier, filename, fileSize){
    // Clean up the identifier
    identifier = cleanIdentifier(identifier);

    // Check if the request is sane
    if (chunkNumber==0 || chunkSize==0 || totalSize==0 || identifier.length==0 || filename.length==0) {
      return 'non_resumable_request';
    }
    var numberOfChunks = Math.max(Math.floor(totalSize/(chunkSize*1.0)), 1);
    if (chunkNumber>numberOfChunks) {
      return 'invalid_resumable_request1';
    }

    // Is the file too big?
    if($.maxFileSize && totalSize>$.maxFileSize) {
      return 'invalid_resumable_request2';
    }

    if(typeof(fileSize)!='undefined') {
      if(chunkNumber<numberOfChunks && fileSize!=chunkSize) {
        // The chunk in the POST request isn't the correct size
        return 'invalid_resumable_request3';
      }
      if(numberOfChunks>1 && chunkNumber==numberOfChunks && fileSize!=((totalSize%chunkSize)+chunkSize)) {
        // The chunks in the POST is the last one, and the fil is not the correct size
        return 'invalid_resumable_request4';
      }
      if(numberOfChunks==1 && fileSize!=totalSize) {
        // The file is only a single chunk, and the data size does not fit
        return 'invalid_resumable_request5';
      }
    }

    return 'valid';
  };


  //'partly_done', filename, original_filename, identifier
  //'done', filename, original_filename, identifier
  //'invalid_resumable_request', null, null, null
  //'non_resumable_request', null, null, null
  $.post = function(req, callback){

    var fields = req.body;
    var files = req.files;

    // set fields
    var chunkNumber = fields['resumableChunkNumber'];
    var chunkSize = fields['resumableChunkSize'];
    var totalSize = fields['resumableTotalSize'];
    var identifier = cleanIdentifier(fields['resumableIdentifier']);
    var filename = fields['resumableFilename'];

    var original_filename = fields['resumableIdentifier'];

    // throw if missing params
    if(!files[$.fileParameterName] || !files[$.fileParameterName].size) {
      callback('invalid_resumable_request', null, null, null);
      return;
    }

    // validation
    var validation = validateRequest(chunkNumber, chunkSize, totalSize, identifier, files[$.fileParameterName].size);
    if(validation=='valid') {

      // building file name for download
      var chunkFilename = getChunkFilename(chunkNumber, identifier);

      // console.log('uploaded file path ' + files[$.fileParameterName].path);
      //
      // console.log('chunk file name ' + chunkFilename)

      // saving chunk
      mv(files[$.fileParameterName].path, chunkFilename, function(err){

        if(err) console.log('err: ' + err)

        // console.log('SAVE DONE');

        // Do we have all the chunks?
        var currentTestChunk = 1;
        var numberOfChunks = Math.max(Math.floor(totalSize/(chunkSize*1.0)), 1);


        // wtf is this pattern?
        var testChunkExists = function(){
          fs.exists(getChunkFilename(currentTestChunk, identifier), function(exists){
            if(exists){
              currentTestChunk++;
              if(currentTestChunk>numberOfChunks) {
                callback('done', filename, original_filename, identifier);
              } else {
                // Recursion
                testChunkExists();
              }
            } else {
              callback('partly_done', filename, original_filename, identifier);
            }
          });
        };


        testChunkExists();
      });
    } else {
      callback(validation, filename, original_filename, identifier);
    }
  };

  return $;
};
