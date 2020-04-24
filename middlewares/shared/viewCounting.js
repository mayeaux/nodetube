const View = require('../../models').View;

async function checkWhetherToCountView(siteVisitorId, uploadID){


  const existingViewsForThisUpload = await View.find({
    siteVisitor : siteVisitorId, // req.siteVisitor._id,
    upload : uploadID //upload._id
  });

  console.log(existingViewsForThisUpload.length)


// calculate if doing fraud helper

  let countViewCount = false;

  let last1hViews = 0;
  let last24hViews = 0;

// console.log(existingViewsForThisUpload);

  // loop through all views for the upload per that user
  for(const view of existingViewsForThisUpload){
    // console.log(view.createdAt);
    // console.log(new Date());

    const timeDiff = new Date() - view.createdAt;

    // console.log(timeDiff);

    // assuming the timeDiff is in ms, then this is the value for one hour
    const timeDiffInH = timeDiff / ( 1000 * 60 * 60);

    const timeDiffInM = timeDiff / ( 1000 * 60);

    // console.log(timeDiffInM);
    // console.log('^ time diff in M ');
    //
    // console.log(timeDiffInH);
    // console.log('^ time diff in H ');

    // if it is less than 1, it happened within lasth
    if(timeDiffInH < 1){
      // console.log('less than 1h')
      last1hViews++;
      // if it has happened within the last 24h
    }

    if (timeDiffInH < 24 ) {

      // console.log('less than 24h')

      last24hViews++
    }
  }

  // console.log(last1hViews, last24hViews);

  // max out at a maximum of 5 views per hour, and 10 views per day
  if(last1hViews < 5 && last24hViews < 10){

    // console.log('should count view');
    countViewCount = true;
  } else {
    // console.log('dont count');
  }

  console.log(countViewCount);

  return countViewCount


}

module.exports =
  checkWhetherToCountView
;