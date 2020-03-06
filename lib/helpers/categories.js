const categoriesObject = require('../../config/categories');

// turn category names into array
function getAllCategories(){
  let categories = [];

  // loop through all categories and add the name for the Upload model enum
  for(const category of categoriesObject){
    categories.push(category.name)
  }

  return categories
}

// turn subcategory names into array
function getAllSubcategories(){
  let subcategories = ['uncategorized'];

  // loop through all categories, then their subcategories
  // add it to an array to be used in the Upload model enum
  for(const category of categoriesObject){
    for(const subcategory of category.subcategories){
      subcategories.push(subcategory.name)
    }
  }

  return subcategories
}

module.exports = {
  getAllCategories,
  getAllSubcategories
};