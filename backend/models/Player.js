const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  totalScore: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema); 