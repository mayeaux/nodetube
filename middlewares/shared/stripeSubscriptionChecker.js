const stripe = require('../../lib/payments/stripe');
const subscriptionsHelpers = require('../../lib/helpers/subscriptions');

// middleware to handle and keep straight Stripe subscriptions and Plus abilities
async function checkSubscriptionRenewalDates(req, res, next){

  // get a new date to see if we should check for stripe subscription status
  const date = new Date();

  // get the stripe subscription id
  const stripeSubscriptionId = req.user && req.user.stripeSubscriptionId;

  // get the renewal date
  const stripeSubscriptionRenewalDate = req.user && req.user.stripeSubscriptionRenewalDate;

  // if the current date is a larger value than the renewal date (aka, it's passed the renewal date time)
  // will update the renewal date

  /** Update renewal **/
  // TODO: test this
  if(stripeSubscriptionRenewalDate && stripeSubscriptionRenewalDate < date ){

    // get the subscription
    const subscription = await stripe.stripeApi.subscriptions.retrieve(stripeSubscriptionId);

    // get the subscription status
    const status = subscription.status;

    // end period for billing
    const renewalDate = subscription.current_period_end;

    // if subscription is active, update renewal date
    if(status === 'active'){
      req.user.stripeSubscriptionRenewalDate = new Date(renewalDate * 1000);
      req.user.stripeSubscriptionStatus = 'active';

    } else {

      // TODO: test this
      // if the value is not active (aka cancelled or unpaid)
      // save status (will be a non 'active' value)
      req.user.stripeSubscriptionStatus = status;

      // TODO: a big of a bug here, is the cancellation date when Stripe is cancelled, or when
      // TODO: cont'd* : not that big of a deal, if I want the stripe cancelled at I can get get it from Stripe
      // the cancellation date is when the period ends (this should work as a catch all)
      req.user.stripeSubscriptionCancellationDate = new Date(subscription.ended_at * 1000);

      // there will be no more renewal date, just a cancellation date
      req.user.stripeSubscriptionRenewalDate = undefined;

      req.user.stripeSubscriptionCancelled = true;

      // revoke the user's plus
      await subscriptionsHelpers.revokeUserPlus(req.user);

      // revoke user Plus subscription

    }

    await req.user.save();
  }

  /** PLUS SUBSCRIPTION HAS CANCELLED FROM THE FRONTEND **/
  // if the stripe subscription is set to cancel
  const stripeSubscriptionCancellationDate = req.user && req.user.stripeSubscriptionCancellationDate;

  // if there is a cancellation date that is passed
  if(stripeSubscriptionCancellationDate && stripeSubscriptionCancellationDate < date){

    // mark subscription as cancelled with status
    req.user.stripeSubscriptionCancelled = true;

    // revoke plus features
    await subscriptionsHelpers.revokeUserPlus(req.user);

    // save updated user
    await req.user.save();
  }

  next();
}

module.exports = checkSubscriptionRenewalDates;
