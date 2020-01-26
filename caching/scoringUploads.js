/**  UNFINISHED **/
/* eslint-disable no-unused-vars */

function scoreReacts(upload){
  let totalScore = 0;

  if(!upload.reacts){
    return totalScore;
  }

  for(const react of upload.reacts){

    const didOwnReact = react.user.toString() == upload.uploader._id.toString();

    if( (react.react == 'like' || react.react == 'laugh' || react.react == 'love') && !didOwnReact ){
      totalScore = totalScore + 1;
    } else if( react.react == 'dislike' && !didOwnReact){
      totalScore = totalScore + 0.5;
    } else if( (react.react == 'sad' || react.react == 'disgust') && !didOwnReact){
      totalScore = totalScore + 0.1;
    }
  }

  return totalScore;
}

async function scoreFreshness(upload){

  var now = moment(new Date()); // todays date
  var end = moment('2015-12-1'); // another date
  var duration = moment.duration(now.diff(end));
  var hours = duration.Hours();
  console.log(hours);

  const oneDayAgoHours = 24;
  const oneWeekAgoHours = 24 * 7;
  const oneMonthAgoHours = 24 * 7 * 30;
  const allTime = 24 * 7 * 365;

  // figure out how many old, figure out the percentages that way based on hours
  // aka, one hour away from turning 24 scores a 23/24, aka 1/24, aka 4.16%
}

function calculateMultiplier(upload){
  const reactScore = scoreReacts(upload);
  // console.log(`react score: ${reactScore}`);

  if(reactScore == 0){
    return 0.1;
  }
  const allTimeViews = upload.viewsAllTime;

  // how many views to get a positive feeling?

  const viewToReactRatio = allTimeViews / reactScore;

  // 150 as a baseline
  // if you score below 150, you are doing pretty hot
  // if you score above

  const baseline = Number(process.env.BASELINE) || 150;

  const multiplier = baseline / viewToReactRatio;

  return multiplier;

}

function scoreUpload(upload){

  const multiplier = calculateMultiplier(upload);
  // console.log(`multiplier: ${multiplier}`);

  // TODO: add freshness
  // const freshness = scoreFreshness

  upload.trendingScores = {};

  // console.log(upload.viewsAllTime);
  // console.log(multiplier);

  upload.trendingScores['24hour'] = upload.viewsWithin24hour * multiplier;
  upload.trendingScores['1week'] = upload.viewsWithin1week * multiplier;
  upload.trendingScores['1month'] = upload.viewsWithin1month * multiplier;
  upload.trendingScores['allTime'] = upload.viewsAllTime * multiplier;

  // console.log(upload.trendingScores);

  return upload;

}

function scoreUploads(uploads){

  let scoredUploads = [];

  for(let upload of uploads){

    // console.log('scoring upload');

    upload = scoreUpload(upload);

    // console.log('scored upload')
    // console.log(upload);

    scoredUploads.push(upload);
  }

  return scoredUploads;

}
