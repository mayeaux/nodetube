/** UNFINISHED **/
/* eslint-disable no-unused-vars */

const winston = require('winston');
const {format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if(process.env.NODE_ENV !== 'production'){
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

winston.loggers.add('category2', {
  level: 'info',
  // format: winston.format.json(),
  format: combine(
    label({ label: 'custom label!' }),
    timestamp(),
    prettyPrint()
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// logger.info('hey something')
//
// logger.log({
//   level: 'error',
//   message: "something went wrong"
// })

//
// Start profile of 'test'
//
// logger.profile('test');
//
// setTimeout(function () {
//   //
//   // Stop profile of 'test'. Logging will now take place:
//   //   '17 Jan 21:00:00 - info: test duration=1000ms'
//   //
//   logger.profile('test');
// }, 1000);

const options = {
  from: new Date() - (24 * 60 * 60 * 1000),
  until: new Date(),
  limit: 10,
  start: 0,
  order: 'desc',
  fields: ['message']
};

//
// Find items logged between today and yesterday.
//
// logger.query(options, function (err, results) {
//   if (err) {
//     /* TODO: handle me */
//     throw err;
//   }
//
//   console.log(results);
// });