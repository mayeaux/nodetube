const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Promise = require("bluebird");

process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: `, err);
  console.log(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection: `, err);
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
  const users = await User.find({
    stripeCustomerId: { $exists: true }
  }).sort({ _id: -1 });

  const delay = 4000;

  let counter = 1;

  for(const user of users){

    await Promise.delay(delay * counter);

    console.log(user.channelUrl);

    counter = counter + 1;

    try {

      const response = await stripe.customers.retrieve(user.stripeCustomerId);

      console.log(response);

      if(response.subscriptions.total_count > 0){
        const subscription = response.subscriptions.data[0];

        const status = subscription.status;
        const subscriptionId = subscription.id;

        user.stripeSubscriptionId = subscriptionId;
        user.stripeSubscriptionStatus = status;
        user.stripeSubscriptionCreationDate = subscription.created;

        if(status === 'active'){
          user.stripeSubscriptionRenewalDate = subscription.current_period_end;
        } else {

          // TODO: revoke user plus
          user.stripeSubscriptionCancellationDate = subscription.ended_at;
          user.stripeSubscriptionCancelled = true;
        }
      }

    } catch(err){
      console.log(err);
    }
  }
}

main();
