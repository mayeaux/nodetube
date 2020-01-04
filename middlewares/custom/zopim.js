async function zopimRedirect(req, res, next){
  let zopimOn = true;

  if(process.env.ZOPIM_OFF == 'true' || process.env.ZOPIM_OFF == true){
    zopimOn = false;
  }

  res.locals.zopimOn = zopimOn;

  next();
}

module.exports = zopimRedirect;