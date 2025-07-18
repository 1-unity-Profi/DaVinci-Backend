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
  },
  // 🚀 NEUE flexible Game-Highscore-Struktur
  gameHighscores: {
    type: Map,
    of: {
      highscore: { type: Number, default: 0 },
      coins: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      lastPlayed: { type: Date, default: Date.now },
      bestLevel: { type: Number, default: 1 },
      bestLines: { type: Number, default: 0 },
      customStats: { type: Map, of: mongoose.Schema.Types.Mixed }
    },
    default: new Map()
  } // ✅ FEHLTE: Diese Klammer
}, {
  timestamps: true
});

// 🎯 Virtuelle Methoden für einfachen Zugriff
playerSchema.methods.getGameStats = function(gameName) {
  return this.gameHighscores.get(gameName) || {
    highscore: 0,
    coins: 0,
    gamesPlayed: 0,
    lastPlayed: new Date(),
    bestLevel: 1,
    bestLines: 0,
    customStats: new Map()
  };
};

playerSchema.methods.updateGameStats = function(gameName, stats) {
  const current = this.getGameStats(gameName);
  const updated = {
    ...current,
    ...stats,
    highscore: Math.max(current.highscore, stats.score || 0),
    coins: (current.coins || 0) + (stats.coinsEarned || 0),
    gamesPlayed: (current.gamesPlayed || 0) + 1,
    lastPlayed: new Date(),
    bestLevel: Math.max(current.bestLevel || 1, stats.level || 1),
    bestLines: Math.max(current.bestLines || 0, stats.lines || 0)
  };
  
  this.gameHighscores.set(gameName, updated);
  return updated;
};

module.exports = mongoose.model('Player', playerSchema);
