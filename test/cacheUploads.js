// var rewire = require('rewire');
// var chai = require('chai');
// var should = chai.should();
//
// const { expect } = require('chai');
// const sinon = require('sinon');
// // require('sinon-mongoose');
//
// var mongoose = require('mongoose');
//
// const mongoUri = 'mongodb://localhost:27017/nodetube';
//
// /**
//  * Connect to MongoDB.
//  */
// mongoose.Promise = global.Promise;
//
// mongoose.Promise = global.Promise;
// mongoose.connect(mongoUri, {
//   keepAlive: true,
//   reconnectTries: Number.MAX_VALUE,
//   useMongoClient: true
// });
//
// mongoose.connection.on('error', (err) => {
//   console.error(err);
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
//   process.exit();
// });
//
// process.on('uncaughtException', (err) => {
//   console.log('Uncaught Exception: ', err);
//   console.log(err.stack);
// });
//
// process.on('unhandledRejection', (err) => {
//   console.log('Unhandled Rejection: ', err);
//   console.log(err.stack);
// });
//
// const User = require('../models/User');
// const Upload = require('../models/Upload');
//
// var app = rewire('../lib/cacheUploads.js');
//
// let getTimeAgoValue = app.__get__('getTimeAgoValue');
//
// // let buildUploadData =  app.__get__('buildUploadData');
// let filterViewsForTimeRange =  app.__get__('filterViewsForTimeRange');
//
// describe('getTimeAgoValue function', function(){
//
//   it('should be a function', function(done){
//     getTimeAgoValue.should.be.a('function');
//     done();
//   });
//
//   it('alltime should return a number', function(done){
//
//     const timeRange = 'alltime';
//
//     const timeAgoValue = getTimeAgoValue(timeRange);
//
//     timeAgoValue.should.be.a('number');
//     done();
//   });
//
//   it('24hour should return a number', function(done){
//
//     const timeRange = '24hour';
//
//     const timeAgoValue = getTimeAgoValue(timeRange);
//
//     timeAgoValue.should.be.a('number');
//     done();
//   });
//
//   it('24h should return an error', function(done){
//
//     // console.log('hello');
//
//     let error;
//
//     try {
//
//       const timeRange = '24h';
//       const timeAgoValue = getTimeAgoValue(timeRange);
//
//     } catch(err){
//       error = err;
//     }
//
//     error.should.be.an('error');
//     done();
//   });
//
// });
//
// describe('buildUploadData function', function(){
//
//   // known issue with chai
//   // it('should be a function', function(done) {
//   //   buildUploadData.should.be.a('function');
//   //   done();
//   // });
//
// });
//
// describe('filterViewsForTimeRange function', function(){
//
//   let upload;
//
//   it('should get upload with checked views', async function(){
//     upload = await Upload.findOne({
//       _id: '599201507b38b1001000baff',
//       uploadUrl: {$exists: true},
//       visibility: 'public',
//       'checkedViews.1': { $exists: true }
//     }).populate('checkedViews uploader').exec();
//
//     upload.should.be.an('object');
//     // checked views
//     upload.checkedViews.length.should.be.above(0);
//   });
//
//   it('should filter off old views', async function(){
//
//     const filteredViews = filterViewsForTimeRange(upload.checkedViews, '24hour');
//
//     filteredViews.should.be.an('array');
//     filteredViews.length.should.equal(0);
//
//   });
//
//   it('should filter off old views', async function(){
//
//     const filteredViews = filterViewsForTimeRange(upload.checkedViews, 'alltime');
//
//     upload.timeRangeViewAmount = filteredViews.length;
//
//     filteredViews.should.be.an('array');
//     filteredViews.length.should.be.above(4);
//
//   });
//
//   it('should add timeRangeViewAmount to upload', async function(){
//
//     const filteredViews = filterViewsForTimeRange(upload.checkedViews, 'alltime');
//     upload.timeRangeViewAmount = filteredViews.length;
//
//     upload.timeRangeViewAmount.should.be.a('number');
//     upload.timeRangeViewAmount.should.equal(5);
//
//   });
//
//   it('should be a function', function(done){
//     filterViewsForTimeRange.should.be.a('function');
//     done();
//   });
//
// });
//
