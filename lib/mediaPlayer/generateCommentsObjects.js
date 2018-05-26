const _ = require('lodash');

const Comment = require('../../models/index.js').Comment;


async function generateComments(upload){
  /** COMMENTS **/

  let commentsWithResponsesPopulated = [];

  // populating the comments' responses
  for(comment of upload.comments){
    let commentWithResponsesPopulated = await Comment.findOne({ _id : comment.id }).populate({path: 'responses commenter', populate: {path: 'commenter'}});
    commentsWithResponsesPopulated.push(commentWithResponsesPopulated)
  }

  // filter out removed comments and response comments (response comments already populated)
  commentsWithResponsesPopulated = _.filter(commentsWithResponsesPopulated, function(comment){
    return comment.visibility == 'public' && !comment.inResponseTo
  });

  // determine if commenter already blocked
  commentsWithResponsesPopulated = commentsWithResponsesPopulated.map(function(comment){

    let commenterBlocked;
    for(const blockedUser of upload.uploader.blockedUsers){
      if(blockedUser._id.toString() == comment.commenter._id){
        commenterBlocked = true;
      }
    }

    if(commenterBlocked){
      comment.commenter.isBlocked = true;
    }

    return comment

  });

  return commentsWithResponsesPopulated
}

module.exports = generateComments
