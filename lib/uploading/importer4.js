const youtubedl = require('youtube-dl')

// kanye tame impala
const url = 'https://www.brighteon.com/bab4d78d-7c0a-4907-a758-678a60e997ce';

const arguments = [];

arguments.push('-f');

arguments.push('bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');

// arguments.push('-f=bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');

try {
  youtubedl.exec(url, arguments, {}, function(err, output) {

    if (err) console.log(err.stderr);

    if(err.stderr = 'thing'){
      // retry it without https?? that fixes banned.video


    }

    console.log(output.join('\n'))
  })
} catch (err){
  console.log(err);
}



