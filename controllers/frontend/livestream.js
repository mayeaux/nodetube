/**
 * GET /
 * Get staging page.
 */
exports.getLiveRTMP = (req, res) => {

  const user = req.params.user;

  console.log(user);


  res.render('livestream/rtmp', {
    user,
    title: 'Livestream ',
    env: process.env.NODE_ENV
  });
};

/**
 * GET /
 * Get viewing page.
 */
exports.getLive = (req, res) => {
  // ?
  if(process.env.LIVESTREAM_APP !== 'true' && process.env.NODE_ENV == 'production'){
    const livestreamApp = 'https://live.pewtube.com';

    return res.redirect(livestreamApp + req.path);
  }

  res.render('livestream/view', {
    title: 'Livestream',
    env: process.env.NODE_ENV
  });
};

