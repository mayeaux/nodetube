const redisClient = require('../config/redis');

let globalRecentUploads;
async function setRecentUploads(){
  globalRecentUploads = await redisClient.getAsync('recentUploads');
  globalRecentUploads = JSON.parse(globalRecentUploads);

  console.log('got uploads cache');
}

setRecentUploads();
setInterval(setRecentUploads, 1000 * 60 * 1);

module.exports = {
  globalRecentUploads
};