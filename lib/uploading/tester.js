const FileType = require('file-type');
const webp = require('webp-converter');


(async () => {
  const fileTypeData = await FileType.fromFile('hq1.jpg');

  const extension = fileTypeData.ext;

  const mime = fileTypeData.mime;

  if(extension == 'webp'){
    console.log('webp fo sho')
  }

  console.log(extension, mime);







  // console.log(fileTypeData.ext);
  //=> {ext: 'png', mime: 'image/png'}
});


async function main(){
  const fileTypeData = await FileType.fromFile('hq2.png');

  console.log(fileTypeData)
}

// main();


function convertFile(originalFile, convertedFile){
  const result = webp.dwebp(originalFile, convertedFile, "-o");

  result.then((response) => {
    console.log(response);
  });
}

const originalFile = 'hq1.jpg';
const convertedFile = 'hq2.png';

module.exports = convertFile;

// make sure convertedFile is .png
// convertFile(originalFile, convertedFile);

