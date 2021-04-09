const stripe = require('../../lib/payments/stripe');

async function checkSubscriptionRenewalDates(req, res, next){
  const stripeSubscriptionRenewalDate = req.user && req.user.stripeSubscriptionRenewalDate;

  const stripeSubscriptionCancellationDate = req.user && req.user.stripeSubscriptionCancellationDate;

  // const date = new Date();
  //
  // const passedRenewalDate = stripeSubscriptionRenewalDate && date > stripeSubscriptionRenewalDate;
  //
  // // check that the subscription is still good and update the date
  // if(passedRenewalDate){
  //   const newRenewalDate = await getNewRenewalDate(req.user.stripeSubscriptionId);
  // }
  //
  // const passedCancellationDate = stripeSubscriptionCancellationDate && date > stripeSubscriptionCancellationDate;
  //
  // if(passedCancellationDate){
  //   req.user.stripeSubscriptionCanceled = true;
  // }
  //
  // await req.user.save();




  console.log(stripeSubscriptionRenewalDate);

  next();
}

module.exports = checkSubscriptionRenewalDates;
