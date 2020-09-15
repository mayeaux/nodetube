const fs = require('fs')
const youtubedl = require('youtube-dl')




try {
  const video = youtubedl('https://www.youtube.com/watch?v=chJPwkjqpQc&ab_channel=Timcast',
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname })

// Will be called when the download starts.
  video.on('info', function(info) {
    delete info.formats
    console.log(info);

    console.log(info.formats[5]);
    // console.log(info.formats);
    // console.log('Download started')
    // console.log('filename: ' + info._filename)
    // console.log('size: ' + info.size)

    // duration
    // height

  })

  // video.pipe(fs.createWriteStream('myvideo.mp4'))

} catch (err){
  console.log(err);
}
