const WebTorrent = require('webtorrent');

global.WEBTORRENT_ANNOUNCE = [];

const client = new WebTorrent();

client.on('error', (err) => {
  console.error(`fatalError ${err.message || err}`);
  process.exit(1);
});

client.add(process.argv[2], {
  path: './test.mp4',
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
  });
});
