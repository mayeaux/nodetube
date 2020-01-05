function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length)
    return false;
  for (var i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i])
      return false;
  }

  return true;
}

/** Code to find errant console logs **/
function showLogLocation(){
  ['log', 'warn', 'error'].forEach(function(method){
    var old = console[method];
    console[method] = function(){
      var stack = (new Error()).stack.split(/\n/);
      // Chrome includes a single "Error" line, FF doesn't.
      if(stack[0].indexOf('Error') === 0){
        stack = stack.slice(1);
      }
      var args = [].slice.apply(arguments).concat([stack[1].trim()]);
      return old.apply(console, args);
    };
  });

}

module.exports = {
  arraysEqual,
  showLogLocation
};