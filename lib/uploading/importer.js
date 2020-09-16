const fs = require('fs')
const youtubedl = require('youtube-dl')




try {
  const video = youtubedl('https://www.youtube.com/watch?v=chJPwkjqpQc&ab_channel=Timcast',
    // Optional arguments passed to youtube-dl.
    [],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname })

// Will be called when the download starts.
  video.on('info', function(info) {
    // delete info.formats
    // console.log(info);

    for(const format of info.formats){




      const hasAudio = format.acodec !== 'none';
      const hasVideo = format.vcodec !== 'none';

      const hasAudioAndVideo = hasAudio && hasVideo;

      if(hasAudioAndVideo){
        console.log('\n');
        console.log('NEW FORMAT \n');
        // console.log(format);

        console.log(hasAudioAndVideo + ' thing')

        const formatNote = format.format_note;

        if(formatNote == '360p'){

          console.log('360p upload')

        } else if (formatNote == '720p'){
          console.log('720p upload')
        } else {
          console.log('NOT 720P OR 360P')
        }

        console.log(format.format_note);

        console.log(format.vcodec , format.acodec)
        // console.log(format);
      }


    }
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
