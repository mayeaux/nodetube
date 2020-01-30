async function customBranding(req, res, next){
  res.locals.brandName = process.env.INSTANCE_BRAND_NAME;
  res.locals.instanceDomainName = process.env.INSTANCE_DOMAIN_NAME;

  next();
}

module.exports = customBranding;