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

// function youtubeDlInfoAsync(url, options) {
//   return new Promise(function(resolve, reject) {
//     youtubedl.getInfo(url, options, function(err, data) {
//       if (err !== null) reject(err);
//       else resolve(data);
//     });
//   });
// }
//
// async function populateTitle() {
//
//   // get save as title div
//   var saveAsTitle = document.getElementsByClassName('saveAsTitle')[0];
//
//   // get text from youtube url div value
//   let text = document.getElementsByClassName('youtubeUrl')[0].value;
//
//
//   const isBrighteonDownload = text.match('brighteon');
//
//   let options;
//   if (isBrighteonDownload) {
//     options = ['-f bestvideo'];
//   } else {
//     options = ['-j', '--flat-playlist', '--dump-single-json'];
//   }
//
//   const info = await youtubeDlInfoAsync(text, options);
//
//   // if its a playlist or channel
//   if (info.length > 2) {
//     console.log(info);
//
//     const playlistinfo = info[info.length - 1];
//
//     const uploader = playlistinfo.uploader;
//     const amountOfUploads = playlistinfo.entries.length;
//
//     console.log(uploader, amountOfUploads);
//
//     downloadPlaylistText.innerHTML = `${amountOfUploads} Item Playlist or Channel To Be Downloaded`;
//     playlistDownloadingDiv.style.display = '';
//     titleDiv.style.display = 'none';
//
//     selectVideoDirectoryInput.value =
//       selectVideoDirectoryInput.value + '/' + uploader;
//
//     console.log('an array');
//   } else if (info.length == 2) {
//
//     console.log(info);
//
//     // TODO: trim here
//
//     const trimmedTitle = info[0].title.substring(0, 200);
//
//     saveAsTitle.value = trimmedTitle;
//
//     playlistDownloadingDiv.style.display = 'none';
//     titleDiv.style.display = '';
//
//     playlistDownloadingDiv.style.display = 'none';
//     titleDiv.style.display = '';
//
//     console.log('single item');
//   } else if (info && info.title) {
//
//     console.log(info);
//
//     const trimmedTitle = info.title.substring(0, 200);
//
//     // TODO: trim here
//     saveAsTitle.value = trimmedTitle;
//
//     playlistDownloadingDiv.style.display = 'none';
//     titleDiv.style.display = '';
//
//     console.log('single item');
//   } else {
//     console.log('ERROR');
//   }
//
//   console.log(info);
// }
//
// document.getElementsByClassName('youtubeUrl')[0].onblur = async function() {
//   await populateTitle();
// };
//
// // frontend code
// function myFunction() {
//   /** WHEN PASTED **/
//
//   // get the copied text off the clipboard
//   navigator.clipboard
//     .readText()
//     .then(async text => {
//
//       // update frontend to reflect text from clipboard
//       document.getElementsByClassName('youtubeUrl')[0].value = text;
//
//       //
//       await populateTitle();
//     })
//     .catch(err => {
//       console.log(err);
//     });
// }
//
// /** SELECT DIRECTORY **/
//
// const saveToDirectory = dir;
//
// selectVideoDirectoryInput.value = saveToDirectory;
//
// const selectVideoDirectoryButton = document.getElementsByClassName(
//   'selectVideoDirectory'
// )[0];
//
// const selectVideoDirectory = (selectVideoDirectoryButton.onclick = function() {
//   // get path from electron and load it as selectedPath
//   var selectedPath = dialog.showOpenDialog({
//     defaultPath: './videos',
//     properties: ['openDirectory']
//   });
//
//   console.log(selectedPath[0]);
//
//   // test if it's a shorter url because its within contained
//   var newThing = selectedPath[0].split(__dirname)[1];
//
//   let adjustedUrlWithCurrentDirectory;
//   if (newThing) {
//     adjustedUrlWithCurrentDirectory = `.${newThing}`;
//   } else {
//     adjustedUrlWithCurrentDirectory = selectedPath[0];
//   }
//   console.log(newThing);
//
//   // console.log(newThing);
//
//   selectVideoDirectoryInput.value = adjustedUrlWithCurrentDirectory;
//
//   if (!fs.existsSync(adjustedUrlWithCurrentDirectory)) {
//     fs.mkdirSync(adjustedUrlWithCurrentDirectory);
//   }
//
// });
//
// // remove youtubedl from pathname to give containing folder
// const youtubeBinaryContainingFolder = youtubeBinaryFilePath.substr(0, youtubeBinaryFilePath.lastIndexOf("\/"));
//
// console.log(`youtubeBinaryContainingFolder: ${youtubeBinaryContainingFolder}`);

// update binary on boot
// downloader(youtubeBinaryContainingFolder, function error(err, done) {
//   if (err) { return console.log(err.stack); }
//   console.log(done);
// });
