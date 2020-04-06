const pagination = require('../../lib/helpers/pagination');
const _ = require('lodash');
const Comment = require('../../models/index').Comment;
const View = require('../../models/index').View;
const React = require('../../models/index').React;
const uploadHelpers = require('../../lib/helpers/settings');

const uploadServer = uploadHelpers.uploadServer;

/**
 * GET /media/recentComments
 * Recent comments
 */
exports.recentComments = async(req, res) => {
  let page = req.params.page;

  if(!page){
    page = 1;
  }

  page = parseInt(page);

  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  try {

    let comments = await Comment.find({
      visibility : { $ne: 'removed'}
    }).populate({path: 'upload commenter', populate: {path: 'uploader'}})
      .sort({ createdAt: -1 })
      .skip((page * limit) - limit)
      .limit(limit);

    // delete comments from videos that arent public
    comments = _.filter(comments, function(comment){
      return comment.upload && comment.upload.visibility == 'public';
    });

    res.render('admin/recentReacts', {
      title: 'Recent Comments',
      comments,
      numbersArray,
      highlightedNumber: page,
      previousNumber,
      nextNumber,
      uploadServer,
      documents: comments,
      recentActionDisplayName: 'Recent Comments'
    });

  } catch(err){
    console.log(err);
    res.send('ERR');
  }

};

/**
 * GET /media/recentComments
 * Recent reacts
 */
exports.recentReacts = async(req, res) => {

  let page = req.params.page;

  if(!page){
    page = 1;
  }
  page = parseInt(page);

  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  const recentAction = 'recentReacts';

  let reacts = await React.find({

  }).populate({path: 'upload user', populate: {path: 'uploader'}})
    .sort({ createdAt: -1 })
    .skip((page * limit) - limit)
    .limit(limit);

  reacts = _.filter(reacts, function(react){
    return react.upload.visibility == 'public' && react.upload.status !== 'processing';
  });

  var durations = [];
    var i = 0;
    for(const upload of uploads) {
      var duration
      durations[i] = ""
      var server = uploadServer
      if(server.charAt(0) == "/") // the slash confuses the file reading, because host root directory is not the same as machine root directory
        server = server.substr(1)
      if(upload.fileType == "video")
        duration = await getVideoDurationInSeconds(`${server}/${upload.uploader.channelUrl}/${upload.uniqueTag + upload.fileExtension}`);
      else if(upload.fileType == "audio")
        duration = await getAudioDurationInSeconds(`${server}/${upload.uploader.channelUrl}/${upload.uniqueTag + upload.fileExtension}`);
      else
        duration = 0;

      var h = Math.round(duration / 3600)
      if(h < 10)
        h = `0${h}`
      var m = Math.round(duration / 60)
      if(m < 10)
        m = `0${m}`
      var s = Math.round(duration % 60)
      if(s < 10)
        s = `0${s}`
      
      if(h > 0)
        durations[i] = `${h}:${m}:${s}`
      else
        durations[i] += `${m}:${s}`
      i++;
    }

  res.render('admin/recentReacts', {
    title: 'Recent Reacts',
    reacts,
    numbersArray,
    highlightedNumber: page,
    previousNumber,
    nextNumber,
    recentAction,
    uploadServer,
    documents: reacts,
    durations: durations,
    recentActionDisplayName: 'Recent Reacts'
  });

};

/**
 * GET /media/recentViews
 * Organize uploads by most recently viewed
 */
exports.recentViews = async(req, res) => {

  let page = req.params.page;

  if(!page){
    page = 1;
  }

  page = parseInt(page);

  const limit = 102;

  const startingNumber = pagination.getMiddleNumber(page);

  const numbersArray = pagination.createArray(startingNumber);

  const previousNumber = pagination.getPreviousNumber(page);

  const nextNumber = pagination.getNextNumber(page);

  let views = await View.find({
    validity: 'real'
  }).populate({path: 'upload', populate: {path: 'uploader'}})
    .sort({ createdAt: -1 })
    .skip((page * limit) - limit)
    .limit(limit);

  views = _.filter(views, function(view){
    return view.upload.visibility == 'public' && view.upload.status !== 'processing';
  });

  var durations = [];
    var i = 0;
    for(const upload of uploads) {
      var duration
      durations[i] = ""
      var server = uploadServer
      if(server.charAt(0) == "/") // the slash confuses the file reading, because host root directory is not the same as machine root directory
        server = server.substr(1)
      if(upload.fileType == "video")
        duration = await getVideoDurationInSeconds(`${server}/${upload.uploader.channelUrl}/${upload.uniqueTag + upload.fileExtension}`);
      else if(upload.fileType == "audio")
        duration = await getAudioDurationInSeconds(`${server}/${upload.uploader.channelUrl}/${upload.uniqueTag + upload.fileExtension}`);
      else
        duration = 0;

      var h = Math.round(duration / 3600)
      if(h < 10)
        h = `0${h}`
      var m = Math.round(duration / 60)
      if(m < 10)
        m = `0${m}`
      var s = Math.round(duration % 60)
      if(s < 10)
        s = `0${s}`
      
      if(h > 0)
        durations[i] = `${h}:${m}:${s}`
      else
        durations[i] += `${m}:${s}`
      i++;
    }

  res.render('admin/recentReacts', {
    title: 'Recent Views',
    views,
    numbersArray,
    highlightedNumber: page,
    previousNumber,
    nextNumber,
    uploadServer,
    documents: views,
    durations,
    recentActionDisplayName: 'Recent Views'
  });

};
