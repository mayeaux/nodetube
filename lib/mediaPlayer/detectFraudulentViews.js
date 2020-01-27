// /** FRAUD CALCULATION, SHOULD PULL OUT INTO OWN LIBRARY **/
// let doingFraud;
// if(process.env.CUSTOM_FRAUD_DETECTION == 'true'){
//   const testIfViewIsLegitimate = require('../../lib/custom/fraudPrevention').testIfViewIsLegitimate;
//
//   doingFraud = await testIfViewIsLegitimate(upload, req.siteVisitor._id);
// } else {
//   doingFraud = false;
// }
//
// console.log(`${new Date()} filtering4`)
//
//
// /** FRAUDULENT VIEW CHECK **/
// // do a legitimacy check here
// if(!doingFraud){
//
//   const view = new View({
//     siteVisitor : req.siteVisitor._id,
//     upload : upload._id,
//     validity: 'real'
//   });
//
//   await view.save();
//   upload.checkedViews.push(view);
//
//   // console.log(upload);
//   await upload.save();
// } else {
//
//   const view = new View({
//     siteVisitor : req.siteVisitor._id,
//     upload : upload._id,
//     validity: 'fake'
//   });
//
//   await view.save();
//   upload.checkedViews.push(view);
//
//   req.siteVisitor.doneFraud = true;
//   await req.siteVisitor.save();
//
//   // console.log(upload);
//   await upload.save();
// }

//
// const legitViews = _.filter(upload.checkedViews, function(view){
//   return view.validity == 'real';
// });
//
// console.log(`${new Date()} filtering2`)
//
// // assuming we always have a site visitor
// const userFakeViews = _.filter(upload.checkedViews, function(view){
//   return( view.siteVisitor.toString() == req.siteVisitor._id.toString() ) && view.validity == 'fake';
// });