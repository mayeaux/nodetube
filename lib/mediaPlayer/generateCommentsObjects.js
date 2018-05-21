const _ = require('lodash');

const Comment = require('../../models/index.js').Comment;


async function generateComments(upload){
  /** COMMENTS **/

  let commentsWithResponsesPopulated = [];

  // populating the comments' responses
  for(comment of upload.comments){
    let commentWithResponsesPopulated = await Comment.findOne({ _id : comment.id }).populate({path: 'responses commenter', populate: {path: 'commenter'}});
    // console.log(newThing);
    commentsWithResponsesPopulated.push(commentWithResponsesPopulated)
  }

  // remove removed comments
  commentsWithResponsesPopulated = _.filter(commentsWithResponsesPopulated, function(comment){
    return comment.visibility == 'public' && !comment.inResponseTo
  });

  console.log(commentsWithResponsesPopulated)


  commentsWithResponsesPopulated = commentsWithResponsesPopulated.map(function(comment){
    let commenterBlocked;
    for(const blockedUser of upload.uploader.blockedUsers){

      console.log(blockedUser._id.toString());

      console.log(comment.commenter._id)
      if(blockedUser._id.toString() == comment.commenter._id){
        commenterBlocked = true;
      }
    }

    console.log(commenterBlocked + ' blocked')

    if(commenterBlocked){
      comment.commenter.isBlocked = true;
    }

    console.log(comment.commenter.isBlocked)

    return comment

  })

  console.log(commentsWithResponsesPopulated)

  return commentsWithResponsesPopulated
}

module.exports = generateComments
