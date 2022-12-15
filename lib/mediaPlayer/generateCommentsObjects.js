const _ = require('lodash');

const Comment = require('../../models/index.js').Comment;


async function generateComments(uploadId){

  /** COMMENTS **/

  const comments = await Comment.find({
    upload: uploadId,
    visibility: 'public',
    inResponseTo : {$exists: false}
  }).populate({path: 'responses commenter', match: { visibility: { $ne: 'removed' } }, populate: {path: 'commenter'}});

  let commentCount = 0;
  for(const comment of comments){
    commentCount++;
    for(const response of comment.responses){
      commentCount++;
    }
  }

  return {
    comments,
    commentCount
  };

  // return console.log(comments);

  // populating the comments' responses
  // for(comment of upload.comments){
  //   // console.log(comment);
  //
  //   let commentWithResponsesPopulated = await Comment.findOne({ _id : comment }).populate({path: 'responses commenter', populate: {path: 'commenter'}});
  //   commentsWithResponsesPopulated.push(commentWithResponsesPopulated)
  // }
  //
  // // filter out removed comments and response comments (response comments already populated)
  // commentsWithResponsesPopulated = _.filter(commentsWithResponsesPopulated, function(comment){
  //   return comment.visibility == 'public' && !comment.inResponseTo
  // });

  // // determine if commenter already blocked
  // commentsWithResponsesPopulated = commentsWithResponsesPopulated.map(function(comment){
  //
  //   let commenterBlocked;
  //   for(const blockedUser of upload.uploader.blockedUsers){
  //     if(blockedUser._id.toString() == comment.commenter._id){
  //       commenterBlocked = true;
  //     }
  //   }
  //
  //   if(commenterBlocked){
  //     comment.commenter.isBlocked = true;
  //   }
  //
  //   return comment
  //
  // });

  // console.log(commentsWithResponsesPopulated)

  // return commentsWithResponsesPopulated



}

module.exports = generateComments;
