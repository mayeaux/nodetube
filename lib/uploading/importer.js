const fs = require('fs');
const youtubedl = require('youtube-dl');

const youtubeLink = 'https://www.youtube.com/watch?v=chJPwkjqpQc&ab_channel=Timcast';

function last(array) {
  return array[array.length - 1];
}

try {
  const video = youtubedl(youtubeLink,
    // Optional arguments passed to youtube-dl.
    [],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });

// Will be called when the download starts.
  video.on('info', function(info) {
    console.log(info.thumbnails);

    var lastThumbnail = last(info.thumbnails);

    console.log(lastThumbnail);


    return

    // delete info.formats
    // console.log(info);

    let format360pDetected = false;
    let format720pDetected = false;

    let format360pformatCode;
    let format720pformatCode;


    for(const format of info.formats){

      let hasAudioAndVideo = false;

      const hasAudio = format.acodec !== 'none';
      const hasVideo = format.vcodec !== 'none';

      hasAudioAndVideo = hasAudio && hasVideo;

      // figure out all the formats that have audio and video and act according to the format note (360p, 720p)

      if(hasAudioAndVideo){

        const formatNote = format.format_note;

        if(formatNote == '360p'){

          format360pformatCode = format.format_id;

          console.log('360p upload');
          format360pDetected = true;

        }

        if (formatNote == '720p'){
          console.log('720p upload');

          format720pDetected = true;

          format720pformatCode = format.format_id;
        } else {
          console.log('NOT 720P OR 360P')


        }


        console.log(format.format_note);

        console.log(format.vcodec , format.acodec)
        // console.log(format);
      }


    }

    console.log('here');
    console.log(format360pDetected)
    console.log(format720pDetected)

    if(format360pDetected && !format720pDetected){

      const video1 = youtubedl(youtubeLink,
        // Optional arguments passed to youtube-dl.
        ['--format=' + format360pformatCode],
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname })

      // Will be called when the download starts.
      video1.on('info', function(info) {
        console.log('Download started')
        console.log('filename: ' + info._filename)
        console.log('size: ' + info.size)
      });

      video1.pipe(fs.createWriteStream('myvideo.mp4'))


    } else if (format360pDetected && format720pDetected){


      const video1 = youtubedl(youtubeLink,
        // Optional arguments passed to youtube-dl.
        ['--format=' + format720pformatCode],
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname })

      // Will be called when the download starts.
      video1.on('info', function(info) {
        console.log('Download started')
        console.log('filename: ' + info._filename)
        console.log('size: ' + info.size)
      });

      video1.pipe(fs.createWriteStream('myvideo.mp4'))


    } else {
      console.log('what the heck is this!')
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
