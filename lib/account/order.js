function getEnglishStringOrder(orderBy){

    let orderByEnglishString;

    if(orderBy == 'alphabetical'){
      orderByEnglishString = 'Alphabetical';
    }

    if(orderBy == 'oldToNew'){
      orderByEnglishString = 'Old To New';
    }

    if(orderBy == 'newToOld'){
      orderByEnglishString = 'New To Old';
    }

    if(orderBy == 'popular'){
      orderByEnglishString = 'Popular';
    }

    return orderByEnglishString;
}

function sortUploads(orderBy, unsortedUploads) {

    let uploads;

    if(orderBy == 'newToOld'){

        // console.log('new to old');
        uploads = unsortedUploads.sort(function(a, b){
          return b.createdAt - a.createdAt;
        });
      }
    
      if(orderBy == 'oldToNew'){
    
        // console.log('old to new');
        uploads = unsortedUploads.sort(function(a, b){
          return a.createdAt - b.createdAt;
        });
      }
    
      if(orderBy == 'alphabetical'){
    
        // console.log('alphabetical');
    
        uploads = unsortedUploads.sort(function(a, b){
          return a.title.localeCompare(b.title);
        });
      }
    
      if(orderBy == 'popular'){
        uploads = unsortedUploads.sort(function(a, b){
          return b.legitViewAmount - a.legitViewAmount;
        });
      }

      return uploads;

}


module.exports = {
    getEnglishStringOrder: getEnglishStringOrder,
    sortUploads : sortUploads
}