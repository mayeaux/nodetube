const _ = require('lodash');

const React = require('../../models/index.js').React;


async function generateReactInfo(upload, user){
  let userReact;
  if(user){
    userReact = await React.findOne({ upload: upload._id, user: user._id });
  }

  let currentReact;
  if(userReact){
    currentReact = userReact.react
  } else {
    currentReact = undefined;
  }

  let likeAmount = await React.count({ react: 'like', upload: upload._id });
  let dislikeAmount = await React.count({ react: 'dislike', upload: upload._id });
  let laughAmount = await React.count({ react: 'laugh', upload: upload._id });
  let sadAmount  = await React.count({ react: 'sad', upload: upload._id });
  let disgustAmount  = await React.count({ react: 'disgust', upload: upload._id });
  let loveAmount = await React.count({ react: 'love', upload: upload._id });

  const emojis = {
    like: {
      name: 'like',
      amount: likeAmount
    },
    dislike: {
      name: 'dislike',
      amount: dislikeAmount

    },
    laugh: {
      name: 'laugh',
      amount: laughAmount
    },
    sad: {
      name: 'sad',
      amount: sadAmount
    },
    disgust: {
      name: 'disgust',
      amount: disgustAmount
    },
    love: {
      name: 'love',
      amount: loveAmount
    },
  }

  return {
    emojis,
    currentReact
  }

}

module.exports = generateReactInfo;