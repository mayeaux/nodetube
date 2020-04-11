const _ = require('lodash');

const React = require('../../models/index.js').React;


async function generateReactInfo(upload, user){

  // TODO: refactor to use this array
  // let emojis = ['like', 'dislike', 'laugh', 'sad', 'disgust', 'love'];

  const reacts = await React.find({ upload: upload._id });

  let likeCount = 0;
  let dislikeCount = 0;
  let laughCount = 0;
  let sadCount = 0;
  let disgustCount = 0;
  let loveCount = 0;

  let userReact = undefined;

  for(const react of reacts){
    if(typeof react.active == 'undefined' || react.active) { // active doesn't exist (previous versions) or active is true
      if(react.react == 'like'){
        likeCount++
      }
      if(react.react == 'dislike'){
        dislikeCount++
      }
      if(react.react == 'laugh'){
        laughCount++
      }
      if(react.react == 'sad'){
        sadCount++
      }
      if(react.react == 'disgust'){
        disgustCount++
      }
      if(react.react == 'love'){
        loveCount++
      }
    }

    if(typeof react.active == 'undefined') { // create active
      react.active = true
      await react.save()
    }

    if(react.user.toString() == ( user && user._id.toString()) && react.active == true){

      userReact = react.react;
    }

  }

  const emojis = {
    like: {
      name: 'like',
      amount: likeCount
    },
    dislike: {
      name: 'dislike',
      amount: dislikeCount

    },
    laugh: {
      name: 'laugh',
      amount: laughCount
    },
    sad: {
      name: 'sad',
      amount: sadCount
    },
    disgust: {
      name: 'disgust',
      amount: disgustCount
    },
    love: {
      name: 'love',
      amount: loveCount
    },
  }

  return {
    emojis,
    currentReact: userReact
  }

}

module.exports = generateReactInfo;