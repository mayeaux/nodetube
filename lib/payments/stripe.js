const secretKey = process.env.STRIPE_API_KEY;
const stripe = require('stripe')(secretKey);

// process.on('uncaughtException', (err) => {
//   console.log(`Uncaught Exception: `, err);
//   console.log(err.stack);
// });
//
// process.on('unhandledRejection', (err) => {
//   console.log(`Unhandled Rejection: `, err);
//   console.log(err.stack);
// });

// create a token programatically
async function createToken(){
  const response = await stripe.tokens.create({
    card: {
      "number": '4242424242424242',
      "exp_month": 12,
      "exp_year": 2018,
      "cvc": '123'
    }
  });

  console.log(response);
  return response
}

// createToken();

const token = { id: 'tok_1BMNmgE8Hfixnsu3gxz5aVjB',
  object: 'token',
  card:
    { id: 'card_1BMNmgE8Hfixnsu3r8DGISSp',
      object: 'card',
      address_city: null,
      address_country: null,
      address_line1: null,
      address_line1_check: null,
      address_line2: null,
      address_state: null,
      address_zip: null,
      address_zip_check: null,
      brand: 'Visa',
      country: 'US',
      cvc_check: 'unchecked',
      dynamic_last4: null,
      exp_month: 12,
      exp_year: 2018,
      fingerprint: 'YUWYygG13agBbiCG',
      funding: 'credit',
      last4: '4242',
      metadata: {},
      name: null,
      tokenization_method: null },
  client_ip: '24.80.117.154',
  created: 1510263722,
  livemode: false,
  type: 'card',
  used: false };

// createToken()

async function createSubscription(){
  const response = stripe.plans.create({
    name: "PewTube - Year Subscription",
    id: "PewTubePlusYear",
    interval: "year",
    currency: "usd",
    amount: 4999,
  });
  console.log(response);
}

// createSubscription();



/** Library **/

const testCustomer = 'cus_BjraRufB9xWNLp'; // test data person

async function getCustomer(){
  stripe.customers.retrieve(
    "cus_BjraRufB9xWNLp",
    function(err, customer) {
      // console.log(JSON.stringify(customer));
      console.log(err);
      console.log(customer);
      console.log(customer.sources);
      // asynchronously called
    }
  );


}

// getCustomer();


// createCustomerWithToken();

// make a charge to the customer programatically
async function chargeCustomer(){
  stripe.charges.create({
    amount: 2000,
    currency: "cad",
    customer: "cus_BjraRufB9xWNLp", // obtained with Stripe.js
    description: "Charge for joshua.davis@example.com"
  }, function(err, charge) {
    console.log(err);
    console.log(charge);
    // asynchronously called
  });
}

// chargeCustomer();

// async function listCustomers(){
//   stripe.customers.list(
//     { limit: 3 },
//     function(err, customers) {
//       console.log(err);
//       console.log(customers);
//       // asynchronously called
//     }
//   );
// }
//
// listCustomers()


// subscribeUser();



/** CURRENTLY USED **/

// save a token with a customer programatically
async function createCustomerWithToken(tokenId, descriptor){
  const response = await stripe.customers.create({
    description: `Customer for ${descriptor}`,
    source: tokenId // obtained with Stripe.js
  });

  // console.log(response);
  return response
};


async function subscribeUser(customer, plan){
  const response = await stripe.subscriptions.create({
    customer : customer,
    items: [
      {
        plan : plan || 'PewTubePlus'
      },
    ],
  });

  // console.log(response);
  return response
};

async function makePurchase(customerId, amount){
  const response = await stripe.charges.create({
    amount,
    currency: 'usd',
    customer: customerId // obtained with Stripe.js
  });

  // console.log(response);
  return response
};

async function main(){
  // const response = await makePurchase('cus_C3Q1u0JahGq2T1', 1000);
  //
  // console.log(response);

  // const customer = await createCustomerWithToken(req.body.token.id, req.body);
  // console.log(response);
  //
  // const response = await subscribeUser(customer.id, 'PewTubePlus');
  // console.log(response);
}

// main();

module.exports = {
  createCustomerWithToken,
  subscribeUser,
  makePurchase
};