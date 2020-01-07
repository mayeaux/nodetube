const domainNameAndTLD = process.env.DOMAIN_NAME_AND_TLD;

const brandName = process.env.INSTANCE_BRAND_NAME;

/**
 * GET /live/${username}
 * Get staging page.
 */
exports.getLiveRTMP = (req, res) => {

  const channelUrl = req.params.user;

  console.log(channelUrl);

  res.render('livestream/rtmp', {
    channelUrl,
    title: 'Livestream ',
    env: process.env.NODE_ENV
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

