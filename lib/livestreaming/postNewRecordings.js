const request = require('request');
const fs = require('fs-extra');

const mongoose = require('mongoose');
const Upload = require('../../models/index.js').Upload;

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/april6pewtube';

// /**
//  * Connect to MongoDB.
//  */
// mongoose.Promise = global.Promise;
//
// mongoose.Promise = global.Promise;
// mongoose.connect(mongoUri, {
//   keepAlive: true,
//   reconnectTries: Number.MAX_VALUE,
//   useMongoClient: true
// });
//
// mongoose.connection.on('error', (err) => {
//   console.error(err);
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
//   process.exit();
// });
//
//
// process.on('uncaughtException', (err) => {
//   console.log(`Uncaught Exception: `, err);
//   console.log(err.stack);
// });
//
// process.on('unhandledRejection', (err) => {
//   console.log(`Unhandled Rejection: `, err);
//   console.log(err.stack);
// });

async function main(){

  const folderToScan = './recordings';

  fs.readdir(folderToScan, (err, files) => {

    // console.log(files);

    if(!files){
      console.log('no files in directory')
      return
    }

    files.forEach(async (file) => {

      // console.log(file);

      const split = file.split('&');

      const username = split[0];
      const filename = split[1];

      const datestamp = filename.split('.')[0]

      console.log('CHECKING ' + username, filename, datestamp);

      // console.log(split);

      let upload = await Upload.findOne({ livestreamDate: datestamp });

      // const upload = 'defined';

      if(!upload){

        const headers = {
          'content-type': 'video/x-flv',
          username,
          filename : file,
          token: 'token',
          date: datestamp
        };

        const url = process.env.POST_RECORDING_ENDPOINT || 'http://127.0.0.1:3000/admin/upload';

        var options = {
          headers,
          url
        };

        console.log(`POSTING ${file} TO UPLOAD`);

        async function postCallBack(err, httpResponse, body){
          if(err){
            console.log(err);
          } else {
            if(httpResponse.statusCode !== 200){
              console.log('blew up')
            } else {
              console.log('worked')

              await fs.move(`./recordings/${file}`, `./uploadedRecordings/${file}`);



              // move file
            }
          }
        }

        fs.createReadStream(`${folderToScan}/${file}`).pipe(request.post(options, postCallBack));

      } else {
        console.log('ALREADY DONE: ' + username, filename, datestamp)
      }


    });


  });

  // find each file
  // for each file, split the file name and look for a file with that date in the database
  // if it already exists, dont post
  // if it does exist, post to ADMIN_URL via code below


  // fs.createReadStream('./recordings/cantwell1.flv').pipe(request.post(options));

  // fs.createReadStream('./recordings/cwell.flv').pipe(request.post(options.url));

}

main();



setInterval(main, 1000 * 60 * 5)