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

  let likeAmount = await React.countDocuments({ react: 'like', upload: upload._id });
  let dislikeAmount = await React.countDocuments({ react: 'dislike', upload: upload._id });
  let laughAmount = await React.countDocuments({ react: 'laugh', upload: upload._id });
  let sadAmount  = await React.countDocuments({ react: 'sad', upload: upload._id });
  let disgustAmount  = await React.countDocuments({ react: 'disgust', upload: upload._id });
  let loveAmount = await React.countDocuments({ react: 'love', upload: upload._id });

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