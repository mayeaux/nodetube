const createSpriteWithVTT = require('generate-video-sprites-node');
/** input and output paths **/
// used in the paths, could use different names if you want
const filename = 'hABy9sJ'

// the file to create sprite and vtt from
const inputFile = `./videos/${filename}.mp4`;

const spriteFileName = `${filename}_sprite.png`;
const vttFileName = `${filename}_sprite.vtt`;

// where to output the files
const spriteOutputFilePath = `./output/${spriteFileName}`;
const webVTTOutputFilePath = `./output/${vttFileName}`;


// used in building the path for sprite prepend
// (aka where the sprite image will be served from)
const prependPath = '/uploads/anthony'

/**  variables to setup the output of the sprite/vtt **/
// how often should a snapshot be taken
const intervalInSecondsAsInteger = 1;

// size of the hover image
const widthInPixels = 300;
const heightInPixels = 169;

// how many columns to use, seems arbitrary so I'll use 5
const columns = 5;

async function createWebVttAndSpriteImage(channelUrl, uploadUniqueTag, uploadFilePath){

  /** input and output paths **/
  // used in the paths, could use different names if you want
  const filename = uploadUniqueTag

  // the file to create sprite and vtt from
  const inputFile = uploadFilePath;

  const spriteFileName = `${uploadUniqueTag}_sprite.png`;
  const vttFileName = `${uploadUniqueTag}_sprite.vtt`;

  const uploaderFolderLocation = `./uploads/${channelUrl}`

  // where to output the files
  const spriteOutputFilePath = `./uploads/${channelUrl}/${spriteFileName}`;
  const webVTTOutputFilePath = `./uploads/${channelUrl}/${vttFileName}`;

  const pathToGenerator = './node_modules/generate-video-sprites-node/generator'

  await createSpriteWithVTT({
    pathToGenerator,
    inputFile,
    intervalInSecondsAsInteger,
    widthInPixels, heightInPixels, columns,
    spriteOutputFilePath,
    webVTTOutputFilePath,
    prependPath: uploaderFolderLocation,
    filename,
    spriteFileName
  })

  console.log('DONE CREATING SPRITE IMAGE AND WEBVTT!');
}

module.exports = createWebVttAndSpriteImage
