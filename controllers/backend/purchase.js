const stripe = require('../../lib/payments/stripe');
const subscriptions = require('../../lib/helpers/subscriptions');

const brandName = process.env.INSTANCE_BRAND_NAME;

exports.purchasePlus = async function(req, res){

  console.log(req.body);

  try {
    const userDescriptor = req.user.channelName || req.user.channelUrl;

    const customer = await stripe.createCustomerWithToken(req.body.token.id, userDescriptor);
    console.log(`Customer created: ${customer.id}`);

    const subscription = await stripe.subscribeUser(customer.id, `${brandName}Plus`);
    console.log(`Subsription created: ${subscription.id}`);

    const updatedUser = await subscriptions.grantUserPlus(req.user);
    console.log(`UPDATED ${req.user.channelUrl} TO PLUS`);
    console.log(updatedUser.privs);

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