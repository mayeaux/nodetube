const youtubedl = require('youtube-dl')

// tame impala 1
const url = 'https://www.youtube.com/watch?v=zKWlEej2j5Q'

// Optional arguments passed to youtube-dl.
const options = []

youtubedl.getInfo(url, options, function(err, info) {
  if (err) throw err

  console.log(info);
})