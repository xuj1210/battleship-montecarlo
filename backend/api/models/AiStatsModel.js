const mongoose = require('mongoose');

const AiStatsSchema = mongoose.Schema({
  matchCount: {
    type: Number,
    required: true
  },
  winCount: {
    type: Number,
    required: true
  },
  moveAvg: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('AiStats', AiStatsSchema);