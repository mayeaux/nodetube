const uploadHelpers = require('../../lib/helpers/settings');
const uploadServer = uploadHelpers.uploadServer;

async function customBranding(req, res, next){
  res.locals.brandName = process.env.INSTANCE_BRAND_NAME;
  res.locals.instanceDomainName = process.env.INSTANCE_DOMAIN_NAME;
  res.locals.instanceContactEmail = process.env.INSTANCE_CONTACT_EMAIL;
  res.locals.adsenseOn = Boolean(process.env.ADSENSE_ID);
  res.locals.adsenseId = process.env.ADSENSE_ID;
  res.locals.uploadServer = uploadServer;

  next();
}

module.exports = customBranding;
