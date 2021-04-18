var srt2vtt = require('srt-to-vtt')
var fs = require('fs')

const inputFileLocation = '';
const outputFileLocation = '';

fs.createReadStream('lordoftherings.srt')
  .pipe(srt2vtt())
  .pipe(fs.createWriteStream('lordoftherings1.vtt'))
