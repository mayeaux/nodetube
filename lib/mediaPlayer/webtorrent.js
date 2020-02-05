var WebTorrent = require('webtorrent')

// var WebTorrent = require('webtorrent-hybrid')


process.on('unhandledRejection', console.log)

var client = new WebTorrent()

client.on('error', (err) => {
  console.error(`fatalError ${err.message || err}`);
  process.exit(1);
});

// client.on('torrent', function (torrent) {
//   console.log('client.seed done', {
//     magnetURI: torrent.magnetURI,
//     ready: torrent.ready,
//     paused: torrent.paused,
//     done: torrent.done,
//     infohash: torrent.infoHash
//   });
// })


client.seed('./c5l.mp4', {
  announce: [ 'wss://tracker.openwebtorrent.com'],
  torrentPort:3000
}, function (torrent) {
  torrent.on('warning', function (err) {
    console.warn(err);
  });
  torrent.on('error', function (err) {
    console.error(err);
  });

  console.log('client.seed done', {
    magnetURI: torrent.magnetURI,
    ready: torrent.ready,
    paused: torrent.paused,
    done: torrent.done,
    infohash: torrent.infoHash
  });

  // console.log('started seeding %s - %s', torrent.infoHash, torrent.files[0].name);
});
