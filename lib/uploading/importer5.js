var fs = require('fs-extra');
const spawn = require('child_process').spawn;
var youtubedl = require('youtube-dl');

// turn off for now, still need that file
// const downloader = require('./downloadBinary');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

console.log(`ffmpeg path: ${ffmpegPath}`);

const youtubeBinaryFilePath = youtubedl.getYtdlBinary();

console.log(`youtube-dl binary path: ${youtubeBinaryFilePath}`);




// var url = 'https://www.youtube.com/watch?v=ZcAiayke00I';
async function download(url) {

  let arguments = [];

  // set the url for ytdl
  arguments.push(url);

  // verbose output
  arguments.push('-v');

  // arguments.push('-f', 'bestvideo+bestaudio/best');

  arguments.push('--add-metadata');

  arguments.push('--ffmpeg-location');

  arguments.push(ffmpegPath);

  arguments.push('--no-mtime');

  arguments.push('--ignore-errors');

  // select download as audio or video

  // download as mp4 if it's youtube (tired of reconverting .flv files)
  const isYouTubeDownload = url.match('youtube');
  if(isYouTubeDownload){
    console.log('downloading from youtube');

    arguments.push('-f');

    arguments.push('bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');
  }

  // arguments.push('best');

  const fileExtension = `%(ext)s`;

  const filePath = '.';

  let saveToFolder = `${filePath}/%(title)s.${fileExtension}`;

  // save to videos directory
  arguments.push('-o', saveToFolder);

  console.log(arguments);

  // deleted for now since it requires ffmpeg
  // download as audio if needed
  // if(downloadAsAudio){
  //   console.log('Download as audio');
  //   arguments.push('-x');
  // }

  console.log(arguments);

  const ls = spawn(youtubeBinaryFilePath, arguments);

  ls.stdout.on('data', data => {

    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', data => {

    console.log(`stderr: ${data}`);
  });

  ls.on('close', code => {

    console.log(`child process exited with code ${code}`);
  });
}

download('https://www.youtube.com/watch?v=AJGPNX9M1bY')

function youtubeDlInfoAsync(url, options) {
  return new Promise(function(resolve, reject) {
    youtubedl.getInfo(url, options, function(err, data) {
      if (err !== null) reject(err);
      else resolve(data);
    });
  });
}
