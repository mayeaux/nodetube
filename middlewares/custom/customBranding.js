async function customBranding(req, res, next){
  res.locals.brandName = process.env.INSTANCE_BRAND_NAME;

  // TODO: we can add other things here as well

  next();
}

module.exports = customBranding;