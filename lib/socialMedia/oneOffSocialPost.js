const gab = require('./gab');
const twitter = require('./twitter');
const facebook = require('./fb');

async function socialPostQueue(message, networks){

  const postToGab = networks.gab;
  const postToTwitter = networks.twitter;
  const postToFacebook = networks.facebook;


  // gab post
  if(postToGab){
    try {
      const gabResponse = await gab.gabPost(message);
      console.log(gabResponse);
    } catch (err){
      console.log(err);
    }
  }

  // twitter post
  if (postToTwitter){
    try {
      const twitterResponse = await twitter.twitterPost(message);
      console.log(twitterResponse);
    } catch (err){
      console.log(err);
    }
  }

  // facebook post
  if (postToFacebook){
    try {
      const faceBookResponse = await facebook.facebookPost(message);
      console.log(faceBookResponse);
    } catch (err){
      console.log(err);
    }
  }

  console.log('Done with one off post');
}

module.exports = socialPostQueue;