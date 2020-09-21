const youtubedl = require('youtube-dl')

const url = 'https://www.youtube.com/watch?v=AJGPNX9M1bY';
// Optional arguments passed to youtube-dl.
const options = []

youtubedl.getInfo(url, options, function(err, info) {
  if (err) throw err

  console.log(info);
})