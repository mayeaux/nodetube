$(function(){

  /*  INCREASE MEDIA PLAYER FUNCTIONALITY START */
  $('.increase-size').on('click', function(){

    var height = $('.display-element').height();
    var width = $('.display-element').width();

    $('.display-element').css( 'height' , ( height * 0.1) + height );
    $('.display-element').css( 'width' , ( width * 0.1) + width );

    // console.log(height, width);
  });

  $('.decrease-size').on('click', function(){

    var height = $('.display-element').height();
    var width = $('.display-element').width();

    $('.display-element').css( 'height' , height - ( height * 0.1));
    $('.display-element').css( 'width' , width - ( width * 0.1));

    // console.log(height, width);
  });
  /*  INCREASE MEDIA PLAYER FUNCTIONALITY END */

  // SHOW REPLY BOX
  $('.reply-link').on('click', function(){
    var replyLinkContainingDiv = $(this).parent().parent().parent();

    // make reply form visible
    var replyContainer = replyLinkContainingDiv.children('.reply-container').css('display', 'inline');
  });

  /* POST COMMENT FUNCTIONALITY START */

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

        if($('.no-comments-div').length > 0  ){

          var html = `<p style="text-align:left;">${data.user} - ${data.timeAgo} &nbsp;</p><p style="text-align:left;">${data.text}</p>`;

          $('.no-comments-header').text('1 Comment');

          return $('.no-comments-div').append(html);

          console.log('No comments yet ');
        }

        console.log(data);

        if(commentForm.hasClass('overall-comment-form')){

          var containingDiv = $('.comment-containing-div');

          var commentDiv =$(`<div style="display:block;padding-bottom:15px;"><p style="text-align:left;">${data.user} - ${data.timeAgo} &nbsp;</p><p style="text-align:left;">${data.text}</p>`);

          var responsesDiv = containingDiv.append(commentDiv);

          console.log('original comment form');

        } else if(commentForm.hasClass('reply-comment-form')){

          var containingDiv = commentForm.parent().parent().parent();

          var commentDiv =$(`<div style="display:block;padding-bottom:15px;padding-left:40px;"><p style="text-align:left;">${data.user} - ${data.timeAgo} &nbsp;</p><p style="text-align:left;">${data.text}</p>`);

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
