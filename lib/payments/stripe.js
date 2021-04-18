const secretKey = process.env.STRIPE_API_KEY;
const stripe = require('stripe')(secretKey);

const brandName = process.env.INSTANCE_BRAND_NAME;

// save a token with a customer programatically
async function createCustomerWithToken(tokenId, descriptor){
  const response = await stripe.customers.create({
    description: `Customer for ${descriptor}`,
    source: tokenId // obtained with Stripe.js
  });

  // console.log(response);
  return response
};


// subscribe user, you can pass a plan or it will auto go to brandNamePlus
// given a customer it will hit create a subscription to a plan
async function subscribeUser(customer, plan){
  const response = await stripe.subscriptions.create({
    customer : customer,
    items: [
      {
        plan : plan || `${brandName}Plus`
      },
    ],
  });

  // console.log(response);
  return response
};

// given a customer Id, create a create for a given amount
async function makePurchase(customerId, amount){
  const response = await stripe.charges.create({
    customer: customerId, // obtained with Stripe.js
    amount,
    currency: 'usd'
  });

  // console.log(response);
  return response
};


// unsubscribe user, you can pass a plan or it will auto go to brandNamePlus
// given a customer it will hit create a subscription to a plan
async function unsubscribeUser(subscriptionId){
  const response = await stripe.subscriptions.del(subscriptionId);

  // console.log(response);
  return response
};

// unsubscribe user, you can pass a plan or it will auto go to brandNamePlus
// given a customer it will hit create a subscription to a plan
async function getNewRenewalDate(subscriptionId){
  const response = await stripe.subscriptions.retrieve(subscriptionId);



  const newRenewalDate = new Date(response.current_period_end * 1000);

  // console.log(response);
  return newRenewalDate
};

module.exports = {
  createCustomerWithToken,
  subscribeUser,
  makePurchase,
  unsubscribeUser,
  getNewRenewalDate,
  stripeApi : stripe
};
