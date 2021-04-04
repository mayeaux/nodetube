// nodetube stripe library
const stripe = require('../../lib/payments/stripe');

// two helper functions to update user to plus/remove their plus features
const subscriptions = require('../../lib/helpers/subscriptions');

const brandName = process.env.INSTANCE_BRAND_NAME;

const planName = process.env.STRIPE_PLAN_NAME;

// HIT FROM THE ACCOUNT PAGE
exports.purchasePlus = async function(req, res){

  console.log(req.body);

  try {
    const userDescriptor = req.user.channelName || req.user.channelUrl;

    // what is this token?
    // it's passed back from stripe after getting hit via the frontend

    const customer = await stripe.createCustomerWithToken(req.body.token.id, userDescriptor);
    console.log(`Customer created: ${customer.id}`);

    const subscription = await stripe.subscribeUser(customer.id, planName || `${brandName}Plus`);
    console.log(`Subscription created: ${subscription.id}`);

    const updatedUser = await subscriptions.grantUserPlus(req.user, customer.id);
    console.log(`UPDATED ${req.user.channelUrl} TO PLUS`);
    console.log(updatedUser.privs);

    res.send('success');
  } catch(err){
    console.log(err);
    res.send('failure');
  }

};

// HIT FROM THE ACCOUNT PAGE
exports.donation = async function(req, res){

  console.log(req.body);

  const amountInDollars = req.body.amount;

  try {
    const userDescriptor = (req.user && req.user.channelName) || (req.user && req.user.channelUrl) || 'NewTube User';

    // what is this token?
    // it's passed back from stripe after getting hit via the frontend

    const customer = await stripe.createCustomerWithToken(req.body.token.id, userDescriptor);
    console.log(`Customer created: ${customer.id}`);

    const purchase = await stripe.makePurchase(customer.id, amountInDollars * 100);
    console.log(`Purchase made: ${purchase}`);
    console.log(purchase);

    res.send('success');
  } catch(err){
    console.log(err);
    res.send('failure');
  }

};

exports.purchaseCredits = async function(req, res){

  try {
    console.log(req.body);

    const userDescriptor = req.user.channelName || req.user.channelUrl;

    const customer = await stripe.createCustomerWithToken(req.body.token.id, userDescriptor);
    console.log(`Customer created: ${customer.id}`);

    req.user.stripeCustomerId = customer.id;

    await req.user.save();

    console.log(customer);

    // typical purchase helper here

    const amount = req.body.amount;

    const purchase = await stripe.makePurchase(customer.id, amount);
    console.log(`Purchase completed: ${purchase.id}`);

    // amount in cents
    req.user.credit = req.user.credit + amount;
    await req.user.save();

    console.log('user amount updated to : ' + amount);

    res.send('success');
  } catch(err){
    console.log(err);
    res.send('failure');
  }

};

// functionality to purchase credits for a user (unused functionality currently)
exports.purchaseCreditsExistingCustomer = async function(req, res){

  try {
    const userDescriptor = req.user.channelName || req.user.channelUrl;

    const customer = await stripe.createCustomerWithToken(req.body.token.id, userDescriptor);
    console.log(`Customer created: ${customer.id}`);

    console.log(customer);

    return res.send('hello');

    // typical purchase helper here

    const amount = req.body.amount;

    const subscription = await stripe.makePurchase(customer.id, amount);
    console.log(`Subsription created: ${subscription.id}`);

    req.user.credit = req.user.credit + amount;
    await req.user.save();

    console.log('user amount updated to : ' + amount);

    res.send('success');
  } catch(err){
    console.log(err);
    res.send('failure');
  }

};

exports.cancelSubscription = async function(req, res){
  console.log(req.body);

  try {
    const stripeCustomerId = req.user.stripeCustomerId;

    const stripeResponse = await stripe.unsubscribeUser(stripeCustomerId, planName || `${brandName}Plus`);
    console.log(`User unsubscribed: ${stripeResponse}`);

    // TODO: have to actually implement this
    req.user.subscriptionCancellationDate = new Date();

    res.send('success');
  } catch(err){
    console.log(err);
    res.send('failure');
  }
};
