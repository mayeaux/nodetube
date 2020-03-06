const categoriesObject = require('../../config/categories');

// simple for loop
function getAllCategories(){
  let categories = [];

  // loop through all categories and add the name for the Upload model enum
  for(const category of categoriesObject){
    categories.push(category.name)
  }

  return categories
}

// simple for loop
function getAllSubcategories(){
  let subcategories = [];

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