const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  originalText: String,
  translatedText: String,
  readingOrder: { type: String, default: "Left-to-Right" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', HistorySchema);
