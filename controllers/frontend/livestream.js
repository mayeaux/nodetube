const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;
const User = require('../../models/index').User;

/**
 * GET /live/${channelUrl}
 * Get RTMP viewing page (current livestream page)
 */
exports.getLiveRTMP = async(req, res) => {

  // TODO: this is backwards
  const channelUrl = req.params.user;

  console.log(channelUrl);

  const user = await User.findOne({ channelUrl });

  const allowedToDoLivestreaming = user && user.privs && user.privs.livestreaming;

  // console.log(req.user);

  // console.log(channelUrl);

  res.render('livestream/rtmp', {
    channelUrl,
    title: 'Livestream ',
    env: process.env.NODE_ENV,
    allowedToDoLivestreaming
  });
};

/**
 * GET /live/$username
 * Get viewing page.
 */
exports.getLive = (req, res) => {

  console.log('here');

  // ?
  if(process.env.LIVESTREAM_APP !== 'true' && process.env.NODE_ENV == 'production'){
    const livestreamApp = `https://live.${domainNameAndTLD}`;

    return res.redirect(livestreamApp + req.path);
  }

  res.render('livestream/view', {
    title: 'Livestream',
    env: process.env.NODE_ENV
  });
};

