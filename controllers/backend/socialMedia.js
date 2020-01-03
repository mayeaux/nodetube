const oneOffSocialPost = require('../../lib/socialMedia/oneOffSocialPost');

const Upload = require('../../models/index').Upload;
const SocialPost = require('../../models/index').SocialPost;

const gab = require('../../lib/socialMedia/gab');
const twitter = require('../../lib/socialMedia/twitter');
const facebook = require('../../lib/socialMedia/facebook');

exports.postCreateSocialPost = async (req, res) => {
  let uniqueTag = req.body.uniqueTag;

  // match everything after last / character
  const regexp = /[^\/]*$/;

  uniqueTag = uniqueTag.match(regexp)[0];

  const distance = req.body.distance;

  const upload = await Upload.findOne({
    uniqueTag
  });

  console.log(req.body);

  const gabOn = req.body.gab;

  const twitterOn = req.body.twitter;

  const facebookOn = req.body.facebook;

  const networks = [];

  if(gabOn == 'on'){
    networks.push('gab');
  }

  if(twitterOn == 'on'){
    networks.push('twitter');
  }

  if(facebookOn == 'on'){
    networks.push('facebook');
  }

  const socialpost = new SocialPost({
    postData: [],
    upload
  });

  for(const network of networks){
    let message;

    if(network == 'gab'){
      message = await gab.buildMessage(uniqueTag, distance);
    } else if(network == 'twitter'){
      message = await twitter.buildMessage(uniqueTag, distance);
    } else if(network == 'facebook'){
      message = await facebook.buildMessage(uniqueTag, distance);
    }

    const obj = {
      network,
      postedCorrectly: false,
      distance,
      message
    };

    socialpost.postData.push(obj);
  }

  await socialpost.save();

  res.redirect('/admin/createSocialPost');
};

exports.postOneOffSocialPost = async (req, res) => {
  const message = req.body.message;

  const gabOn = req.body.gab;

  const twitterOn = req.body.twitter;

  const facebookOn = req.body.facebook;

  const networks = {
    gab: gabOn,
    facebook: facebookOn,
    twitter: twitterOn
  };

  await oneOffSocialPost(message, networks);

  req.flash('success', { msg: 'One off message sent' });

  res.redirect('/admin/oneOffSocialPost');
};
