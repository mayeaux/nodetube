var WebTorrent = require('webtorrent-hybrid')

process.on('unhandledRejection', console.log)

var client = new WebTorrent()

client.seed('./c4l.mp4', function (torrent) {
  console.log(torrent);

  // console.log('started seeding %s - %s', torrent.infoHash, torrent.files[0].name);
});
