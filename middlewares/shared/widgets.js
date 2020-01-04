async function zopimWidget(req, res, next){
  let zopimOn;

  if(process.env.ZOPIM_ON == 'true'){
    zopimOn = true;
  }

  res.locals.zopimIdentifier = process.env.ZOPIM_IDENTIFIER;

  res.locals.zopimOn = zopimOn;

  next();
}

async function googleAnalyticsWidget(req, res, next){

  let googleAnalyticsOn = false;

  if(process.env.GOOGLE_ANALYTICS_ON == 'true'){
    googleAnalyticsOn = 'true';
  }

  res.locals.googleAnalyticsOn = googleAnalyticsOn;
  res.locals.googleAnalyticsId =  process.env.GOOGLE_ANALYTICS_ID;

  next();
}

async function recaptchaWidget(req, res, next){

  let recaptchaOn = false;

  if(process.env.RECAPTCHA_ON == 'true'){
    recaptchaOn = 'true';
  }

  res.locals.recaptchaOn = recaptchaOn;

  next();
}

async function coinhiveWidget(req, res, next){
  let coinhiveOn = false;

  if(process.env.COINHIVE_ON == 'true'){
    coinhiveOn = 'true';
  }

  res.locals.coinhiveOn = coinhiveOn;

  res.locals.coinhiveIdentifier = process.env.COINHIVE_IDENTIFIER;

  next();
}

module.exports = {
  zopimWidget,
  googleAnalyticsWidget,
  recaptchaWidget,
  coinhiveWidget
};