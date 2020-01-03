const mongoose = require('mongoose');

const SearchQuerySchema = new mongoose.Schema({
  query: String,
  searcher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

const SearchQuery = mongoose.model('SearchQuery', SearchQuerySchema);

module.exports = SearchQuery;
