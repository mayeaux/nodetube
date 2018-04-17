const Promise = require('bluebird');
var redis = require('redis');


const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword =  process.env.REDIS_PASSWORD || '';

const options = {
  host: redisHost,
  port: redisPort,
  password: redisPassword
};

console.log(`Connecting to redis, host: ${redisHost}, port: ${redisPort}`)

var client = redis.createClient(options); //creates a new redisClient

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

module.exports = client;