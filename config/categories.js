const instanceBrandName = process.env.INSTANCE_BRAND_NAME || 'NodeTube';

const categories = [
  {
    name: 'all',
    displayName: 'All Uploads',
    subcategories: []
  },
  {
    name: 'overview',
    displayName: 'Category Overview',
    subcategories: []
  },
  // the two above don't display regularly they're their own thing
  {
    name: 'nodeTube',
    displayName: `${instanceBrandName} Related`,
    subcategories: []
  },
  {
    name: 'howToAndEducation',
    displayName: 'How To & Education',
    subcategories: []
  },
  {
    name: 'technologyAndScience',
    displayName: 'Technology & Science',
    subcategories: [
      { name: 'blockchain', displayName: 'Blockchain' },
      { name: 'internet', displayName: 'Internet'},
      { name: 'software', displayName: 'Software'}
    ]
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    subcategories: []
  },
  {
    name: 'comedy',
    displayName: 'Comedy',
    subcategories: [
      { name: 'pranks', displayName: 'Pranks' },
      { name: 'political', displayName: 'Political'}
    ]
  },

  {
    name: 'healthAndWellness',
    displayName: 'Health And Wellness',
    subcategories: [
      { name: 'yogaAndMeditation', displayName: 'Yoga & Meditation' },
      { name: 'fitness', displayName: 'Fitness'}
    ]
  },
  {
    name: 'music',
    displayName: 'Music',
    subcategories: []
  },
  {
    name: 'news',
    displayName: 'News',
    subcategories: []
  },
  {
    name: 'politics',
    displayName: 'Politics',
    subcategories: [
      { name: 'leftwing', displayName: 'Leftwing' },
      { name: 'rightwing', displayName: 'Rightwing'}
    ]
  },
  {
    name: 'uncategorized',
    displayName: 'Uncategorized',
    subcategories: []
  }
];

module.exports = categories;