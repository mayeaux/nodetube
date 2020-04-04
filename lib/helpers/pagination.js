const getPreviousNumber = function(page){
  let previousNumber;
  if(page == 1){
    previousNumber = 1
  } else if (page == 2){
    previousNumber = 1
  } else {
    previousNumber = page - 1
  }

  return previousNumber
};

let getNextNumber = function(page){
  let nextNumber;
  if(page == 1){
    nextNumber = 2
  } else if (page == 2){
    nextNumber = 3
  } else {
    nextNumber = page + 1
  }

  return nextNumber
};

function getMiddleNumber(startingNumber){
  if(startingNumber == 1){
    return 3
  }
  if(startingNumber == 2){
    return 3
  }
  else{
    return startingNumber
  }
}

function createArray(middleNumber){
  let array = [];

  for(let x=0; x < 5; x++){
    let newNumber = middleNumber - (x-2);
    array.push(newNumber)
  }

  return array.reverse()
}


function createEnglishString(timeRange){
  let englishString;
  if (timeRange == '1hour'){
    englishString = 'Last Hour';
  } else if(timeRange == '24hour' || timeRange == '1day'){
    englishString = 'Last Day';
  } else if (timeRange == '1week'){
    englishString = 'Last Week';
  } else if (timeRange == '1month'){
    englishString = 'Last Month';
  } else {
    return 'All Time'
  }

  return englishString
}

function createWithinString(queryWithin){
  // console.log('QUERY WITHIN' + queryWithin) ;

  let timeAgoDate;
  if (queryWithin == '1hour'){
    timeAgoDate = '?within=1hour';
  } else if(queryWithin == '24hour' || queryWithin == '1day'){
    timeAgoDate = '?within=24hour';
  } else if (queryWithin == '1week'){
    timeAgoDate = '?within=1week';
  } else if (queryWithin == '1month'){
    timeAgoDate = '?within=1month';
  } else {
    timeAgoDate = '?within=alltime';
  }

  return timeAgoDate
}

function buildPaginationObject(page){

  const startingNumber = getMiddleNumber(page);
  const numbersArray = createArray(startingNumber);
  const previousNumber = getPreviousNumber(page);
  const nextNumber = getNextNumber(page);

  return  {
    startingNumber,
    numbersArray,
    previousNumber,
    nextNumber
  }
}



// const pages = pagination.getPaginationArray();

// const pagination = {
//   startingNumber: pagination.getMiddleNumber(page),
//   numbersArray : pagination.createArray(startingNumber),
//   previousNumber : pagination.getPreviousNumber(page),
//   nextNumber : pagination.getNextNumber(page)
// }

module.exports = {
  getPreviousNumber,
  getNextNumber,
  getMiddleNumber,
  createArray,
  createEnglishString,
  createWithinString,
  buildPaginationObject
};