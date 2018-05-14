const categories = [
  {
    name: 'comedy',
    displayName: 'Comedy',
    subcategories: [
      { name: 'pranks', displayName: 'Pranks' },
      { name: 'political', displayName: 'Political'}
    ],
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    subcategories: []
  },
  {
    name: 'healthAndWellness',
    displayName: 'Health And Wellness',
    subcategories: ['yogaAndMeditation', 'fitness']
  },
  {
    name: 'technologyAndScience',
    displayName: 'Technology & Science',
    subcategories: ['blockchain', 'internet']
  },
  {
    name: 'howToAndEducation',
    displayName: 'How To & Education',
    subcategories: []
  },
  {
    name: 'politics',
    displayName: 'Politics',
    subcategories: ['rightwing', 'leftwing']
  },
  {
    name: 'news',
    displayName: 'News',
    subcategories: []
  },
  {
    name: 'uncategorized',
    displayName: 'Uncategorized'
  },
];

module.exports = categories;