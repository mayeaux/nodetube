const fs = require('fs')
const youtubedl = require('youtube-dl')




try {
  const video = youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA',
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname })

// Will be called when the download starts.
  video.on('info', function(info) {
    console.log(info.formats);
    console.log('Download started')
    console.log('filename: ' + info._filename)
    console.log('size: ' + info.size)
  })

  // video.pipe(fs.createWriteStream('myvideo.mp4'))
} catch (err){
  console.log(err);
}
