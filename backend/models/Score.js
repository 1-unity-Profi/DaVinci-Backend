const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number, // Spielzeit in Sekunden
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Score', scoreSchema);