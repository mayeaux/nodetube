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

  // TODO: test this
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

      // TODO: test this
      // if the value is not active (aka cancelled or unpaid)
      // save status (will be a non 'active' value)
      req.user.stripeSubscriptionStatus = status;


      // TODO: test this
      // the cancellation date is when the period ends (this should work as a catch all)
      req.user.stripeSubscriptionCancellationDate = subscription.current_period_end;

      // there will be no more renewal date, just a cancellation date
      req.user.stripeSubscriptionRenewalDate = undefined;

      // revoke the user's plus
      // await subscriptionsHelpers.revokeUserPlus(req.user);

      // revoke user Plus subscription

    }

    await req.user.save();
  }

  /** USER HAS CANCELLED FROM THE FRONTEND **/
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

    await subscriptionsHelpers.revokeUserPlus(req.user);

    // TODO: cancel subscription

    await req.user.save();

  }

  next();
}

module.exports = checkSubscriptionRenewalDates;
