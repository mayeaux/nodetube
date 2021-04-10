const stripe = require('../../lib/payments/stripe');

// middleware to handle and keep straight Stripe subscriptions and Plus abilities
async function checkSubscriptionRenewalDates(req, res, next){

  // get a new date to see if we should check for stripe subscription status
  const date = new Date();

  // get the renewal date
  const stripeSubscriptionRenewalDate = req.user && req.user.stripeSubscriptionRenewalDate;

  const stripeSubscriptionId = req.user.stripeSubscriptionId;

  // if the current date is a larger value than the renewal date (aka, it's passed the renewal date time)
  if(stripeSubscriptionRenewalDate && stripeSubscriptionRenewalDate < date ){

      // get the subscription
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // get the subscription status
      const status = subscription.status;

      // end period for billing
      const renewalDate = subscription.current_period_end;

      if(status === 'active'){
        req.user.stripeSubscriptionRenewalDate = renewalDate;
        req.user.stripeSubscriptionStatus = 'active';

      } else {
        // save status (will be a non 'active' value)
        req.user.stripeSubscriptionStatus = status;

        // the cancellation date is when the period ends (this should work as a catch all)
        req.user.stripeSubscriptionCancellationDate = subscription.current_period_end;

        // there will be no more renewal date, just a cancellation date
        req.user.stripeSubscriptionRenewalDate = undefined;
        // revoke user Plus subscription

      }

      await req.user.save();
  }

  // if the stripe subscription is set to cancel

  const stripeSubscriptionCancellationDate = req.user && req.user.stripeSubscriptionCancellationDate;

  // if there is a cancellation date that is passed
  if(stripeSubscriptionCancellationDate && stripeSubscriptionCancellationDate < date){

    // get the subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // get the subscription status
    const status = subscription.status;

    // subscription is no longer active
    const notActive = status !== 'active';

    // when the subscription ended
    const endedAtTime = subscription.ended_at;

    // mark subscription as cancelled with status
    if(notActive && endedAtTime){
      req.user.stripeSubscriptionCancelled = 'true';
      req.user.stripeSubscriptionStatus = status;
    }

    await req.user.save();

  }

  next();
}

module.exports = checkSubscriptionRenewalDates;
