// This is a helper for adding missing data to User regarding Stripe subscription

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Promise = require('bluebird');
const moment = require('moment');

const subscriptionHelpers = require('../../lib/helpers/subscriptions');

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception: ', err);
  console.log(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection: ', err);
  console.log(err.stack);
});

dotenv.load({ path: '.env.private' });
dotenv.load({ path: '.env.settings' });

const brandName = process.env.INSTANCE_BRAND_NAME;

const secretKey = process.env.STRIPE_API_KEY;

const stripe = require('stripe')(secretKey);

const mongoUri = process.env.MONGODB_URI;

console.log(secretKey);

console.log('Connected to ' + mongoUri);

mongoose.Promise = global.Promise;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect(mongoUri, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

const User = require('../../models/index').User;

async function main(){

  // find users where the customerId exists (have paid), and it's not cancelled but lacks stripeSubscriptionId
  const users = await User.find({
    stripeCustomerId: { $exists: true },

    // for now, do it where there is no stripeSubscriptionId
    $and:[ {  stripeSubscriptionId : { $exists: false } }, {  stripeSubscriptionCancelled : { $exists: false } }]

  }).sort({ _id: -1 });

  console.log(`Amount of users to check: ${users.length}`);

  const firstDelayAmount = 4000;

  const secondaryDelay = 6000;

  for(const user of users){

    console.log(`Waiting ${firstDelayAmount/1000} seconds`);

    await Promise.delay(firstDelayAmount);

    console.log(`User channel url: ${user.channelUrl}`);

    try {

      // get info for the customer
      const response = await stripe.customers.retrieve(user.stripeCustomerId);

      const customerDescription = response.description;

      console.log(`Description: ${customerDescription}`);

      // if there are some subscriptions for the user
      if(response.subscriptions.total_count > 0){
        const subscription = response.subscriptions.data[0];

        const createdAtTime = subscription.created;

        const currentPeriodStart = subscription.current_period_start;

        const currentPeriodEnd = subscription.current_period_end;

        const endedAtDate = subscription.ended_at;

        console.log(`Created at time: ${moment.unix(createdAtTime).format('dddd, MMMM Do, YYYY h:mm:ss A')}`);

        console.log(`Status: ${subscription.status}`);

        console.log(`Current period start: ${moment.unix(currentPeriodStart).format('dddd, MMMM Do, YYYY h:mm:ss A')}`);

        console.log(`Current period end: ${moment.unix(currentPeriodEnd).format('dddd, MMMM Do, YYYY h:mm:ss A')}`);

        if(endedAtDate) console.log(`Ended at date: ${endedAtDate}`);

        // console.log(subscription);

        const status = subscription.status;

        // console.log(secondaryDelay);

        console.log(`Waiting ${secondaryDelay/1000} seconds`);

        // secondary delay before
        await Promise.delay(secondaryDelay);

        const subscriptionId = subscription.id;

        console.log(`Adding subscription id: ${subscriptionId}, status, and creation date`);

        user.stripeSubscriptionId = subscriptionId;
        user.stripeSubscriptionStatus = status;
        user.stripeSubscriptionCreationDate = new Date(subscription.created * 1000);

        if(status === 'active'){

          console.log(`Status is active, adding a renewal date: ${moment.unix(currentPeriodEnd).format('dddd, MMMM Do, YYYY h:mm:ss A')}`);

          user.stripeSubscriptionRenewalDate = new Date(currentPeriodEnd * 1000);
        } else {

          console.log(`Status is ${status}, adding ended at date: ${moment.unix(endedAtDate).format('dddd, MMMM Do, YYYY h:mm:ss A')}, saving as cancelled`);

          // TODO: should I use ended_at or cancelled_at
          // they seem to be the same
          // user.stripeSubscriptionRenewalDate = new Date(subscription.current_period_end * 1000);

          user.stripeSubscriptionCancellationDate = new Date(endedAtDate * 1000);
          user.stripeSubscriptionCancelled = true;

          console.log('Revoking user plus values');
          await subscriptionHelpers.revokeUserPlus(user);
        }

        await user.save();
      } else {
        console.log('No active subscription, assume it has been cancelled');

        console.log('Waiting 4 seconds');

        await Promise.delay(firstDelayAmount);

        user.stripeSubscriptionCancelled = true;

        console.log('Revoking user plus values');
        await subscriptionHelpers.revokeUserPlus(user);

        await user.save();

      }

    } catch(err){
      console.log(err);
    }
  }
}

main();
