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

module.exports = {
  getPreviousNumber,
  getNextNumber,
  getMiddleNumber,
  createArray
};