var fs = require('fs');
var srt2vtt = require('srt2vtt');

var srtData = fs.readFileSync('test.srt');
srt2vtt(srtData, function(err, vttData) {
  if (err) throw new Error(err);
  fs.writeFileSync('captions.vtt', vttData);
});
