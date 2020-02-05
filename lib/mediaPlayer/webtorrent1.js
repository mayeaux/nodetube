var WebTorrent = require('webtorrent-hybrid')

process.on('unhandledRejection', console.log)

var client = new WebTorrent()

client.on('error', (err) => {
  console.error(`fatalError ${err.message || err}`);
  process.exit(1);
});

client.seed('./c4l.mp4', {
  announce: [
    'http://192.168.1.44:8000/announce',
  ],
}, torrent => {
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
});
