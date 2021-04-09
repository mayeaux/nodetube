const stripe = require('../../lib/payments/stripe');

// middleware to handle and keep straight Stripe subscriptions and Plus abilities
async function checkSubscriptionRenewalDates(req, res, next){
  const date = new Date();

  const stripeSubscriptionRenewalDate = req.user && req.user.stripeSubscriptionRenewalDate;

  // if it's set to renew
  if(stripeSubscriptionRenewalDate){
    // if the current date is a larger value than the renewal date (aka, it's passed the renewal date time)
    if(stripeSubscriptionRenewalDate < date){
      // increment this date by 30 days
      // req.user.stripeSubscriptionRenewalDate =
    }
  }

  const stripeSubscriptionCancellationDate = req.user && req.user.stripeSubscriptionCancellationDate;

  // if it's set to cancel
  if(stripeSubscriptionCancellationDate){

    // if the current date is a larger value than the cancellation date (aka, it's passed the cancellation date time)
    if(stripeSubscriptionCancellationDate < date){

      // await revokeUserPlusFeatures()
      //
      // req.user.stripeSubscriptionCancellationDate = undefined;
      //
      // await req.user.save();

    }
  }
  
  // third case = user has plus but not renewal date, cancellation fee etc (maybe I should do this as a migration so I can handle errors as they come through)





  console.log(stripeSubscriptionRenewalDate);

  next();
}

module.exports = checkSubscriptionRenewalDates;
