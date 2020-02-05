const Server = require('bittorrent-tracker').Server;

const server = new Server();

server.on('error', function (err) {
  console.error('ERROR: ' + err.message);
});
server.on('warning', function (err) {
  console.log('WARNING: ' + err.message);
});
server.on('update', function (addr) {
  console.log('update: ' + addr);
});
server.on('complete', function (addr) {
  console.log('complete: ' + addr);
});
server.on('start', function (addr, params) {
  console.log(`start addr:${params.ip}:${params.port} info_hash:${params.info_hash}`);
});
server.on('stop', function (addr) {
  console.log('stop: ' + addr);
});

server.listen(8000, {
  http: true,
  ws: true,
  stats:true,
  udp:false,
});