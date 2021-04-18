// I guess this is comment functionality?

$(function(){

  // SHOW REPLY BOX
  $('.reply-link').on('click', function(){
    var replyLinkContainingDiv = $(this).parent().parent().parent();

    // make reply form visible
    var replyContainer = replyLinkContainingDiv.children('.reply-container').css('display', 'inline');
  });

  /** POST COMMENT FUNCTIONALITY START **/

  $('.comment-posted').hide();

  // submit AJAX but don't refresh the page
  $('.comment-form').submit(function(e){

    var commentForm = $(this);

    commentForm.hide();

    e.preventDefault();

    $.ajax({
      type: 'POST',
      url: '/api/comment',
      data: $(this).serialize(),
      success: function(data){

        console.log(data);

        if(data == 'Comment already exists'){
          return swal('Sorry, that comment has already been sent');
        }

        // if there's no comments yet, append the comment and mark it as '1 Comment'
        if($('.no-comments-div').length > 0  ){

          var html = `<p class="fw" style="text-align:left;">${data.user} - ${data.timeAgo} &nbsp;</p><p class="fw" style="text-align:left;">${data.text}</p>`;

          $('.no-comments-header').text('1 Comment');

          return $('.no-comments-div').append(html);

          console.log('No comments yet ');
        }

        console.log(data);

        // if it's a regular comment and not a reply
        if(commentForm.hasClass('overall-comment-form')){

          var containingDiv = $('.commentCountDiv');

          var commentDiv =$(`<div style="display:block;padding-bottom:15px;"><p class="fw" style="text-align:left;">${data.user} - ${data.timeAgo} &nbsp;</p><p class="fw" style="text-align:left;">${data.text}</p>`);

          var responsesDiv = containingDiv.append(commentDiv);

          console.log('original comment form');

          // if it's a reply
        } else if(commentForm.hasClass('reply-comment-form')){

          var containingDiv = commentForm.parent().parent().parent();

          var commentDiv =$(`<div style="display:block;padding-bottom:15px;padding-left:40px;"><p class="fw" style="text-align:left;">${data.user} - ${data.timeAgo} &nbsp;</p><p class="fw" style="text-align:left;">${data.text}</p>`);

          var responsesDiv = containingDiv.children('.responses').append(commentDiv);

        }

        // console.log(data);
      },
      error: function(err){
        console.log(err);
      }
    });

    return false;
  });

  $('.refresh-page').on('click', function(){
    window.location.reload(false);
  });
  /* POST COMMENT FUNCTIONALITY END */

});
