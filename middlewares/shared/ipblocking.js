const ipfilter = require('express-ipfilter').IpFilter;

const ips = ['::ffff:127.0.0.1', '127.0.0.1'];

module.exports = ipfilter(ips, { log: false });
