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
      customStats: { type: Map, of: mongoose.Schema.Types.Mixed, default: () => new Map() }
    },
    default: new Map()
  }
}, {
  timestamps: true
});

// 🎯 Virtuelle Methoden für einfachen Zugriff
playerSchema.methods.getGameStats = function(gameName) {
  const gameStats = this.gameHighscores.get(gameName);
  if (!gameStats) {
    // Nur beim ersten Mal default Werte setzen
    const defaultStats = {
      highscore: 0,
      coins: 0, // Keine Coins standardmäßig
      gamesPlayed: 0,
      lastPlayed: new Date(),
      bestLevel: 1,
      bestLines: 0,
      customStats: new Map()
    };
    
    // Für Spaceship-Game: Startpaket nur beim allerersten Mal
    if (gameName === 'spaceships') {
      defaultStats.coins = 1000; // Starter-Coins nur einmalig
      const customStats = new Map();
      customStats.set('ownedShips', ['basic']);
      customStats.set('equippedShip', 'basic');
      customStats.set('ownedUpgrades', []);
      defaultStats.customStats = customStats;
    }
    
    // Sofort speichern, damit es nicht wieder passiert
    this.gameHighscores.set(gameName, defaultStats);
    return defaultStats;
  }
  
  // Ensure customStats is a Map
  if (!(gameStats.customStats instanceof Map)) {
    gameStats.customStats = new Map(Object.entries(gameStats.customStats || {}));
  }
  
  // Backwards compatibility: Für existierende Spieler ohne ownedShips
  if (gameName === 'spaceships') {
    const customStats = gameStats.customStats;
    if (!customStats.has('ownedShips')) {
      customStats.set('ownedShips', ['basic']);
    }
    if (!customStats.has('equippedShip')) {
      customStats.set('equippedShip', 'basic');
    }
    if (!customStats.has('ownedUpgrades')) {
      customStats.set('ownedUpgrades', []);
    }
  }
  
  return gameStats;
};

playerSchema.methods.updateGameStats = function(gameName, stats) {
  const current = this.getGameStats(gameName);
  
  // Handle custom stats properly
  let updatedCustomStats = current.customStats || new Map();
  if (stats.customStats) {
    // Merge custom stats
    Object.entries(stats.customStats).forEach(([key, value]) => {
      updatedCustomStats.set(key, value);
    });
  }
  
  // For spaceship game, update cumulative stats
  if (gameName === 'spaceships' && stats.customStats) {
    if (stats.customStats.asteroidsDestroyed) {
      const total = (updatedCustomStats.get('totalAsteroidsDestroyed') || 0) + stats.customStats.asteroidsDestroyed;
      updatedCustomStats.set('totalAsteroidsDestroyed', total);
    }
    
    if (stats.customStats.powerUpsCollected) {
      const total = (updatedCustomStats.get('totalPowerUpsCollected') || 0) + stats.customStats.powerUpsCollected;
      updatedCustomStats.set('totalPowerUpsCollected', total);
    }
    
    if (stats.customStats.accuracy !== undefined) {
      const bestAccuracy = Math.max(updatedCustomStats.get('bestAccuracy') || 0, stats.customStats.accuracy);
      updatedCustomStats.set('bestAccuracy', bestAccuracy);
    }
    
    if (stats.customStats.survivalTime !== undefined) {
      const totalTime = (updatedCustomStats.get('totalPlayTime') || 0) + stats.customStats.survivalTime;
      updatedCustomStats.set('totalPlayTime', totalTime);
      
      const avgSurvival = totalTime / Math.max(current.gamesPlayed + 1, 1);
      updatedCustomStats.set('averageSurvivalTime', avgSurvival);
    }
    
    if (stats.customStats.shipUsed) {
      updatedCustomStats.set('favoriteShip', stats.customStats.shipUsed);
    }
  }
  
  // For Tilli Timian game, update cumulative stats
  if (gameName === 'tillitimian' && stats.customStats) {
    // Ensure all values are properly converted to numbers
    if (stats.customStats.totalGearsCollected !== undefined) {
      const total = (updatedCustomStats.get('totalGearsCollected') || 0) + Number(stats.customStats.totalGearsCollected);
      updatedCustomStats.set('totalGearsCollected', total);
    }
    
    if (stats.customStats.totalEnemiesDefeated !== undefined) {
      const total = (updatedCustomStats.get('totalEnemiesDefeated') || 0) + Number(stats.customStats.totalEnemiesDefeated);
      updatedCustomStats.set('totalEnemiesDefeated', total);
    }
    
    if (stats.customStats.totalDeaths !== undefined) {
      const total = (updatedCustomStats.get('totalDeaths') || 0) + Number(stats.customStats.totalDeaths);
      updatedCustomStats.set('totalDeaths', total);
    }
    
    if (stats.customStats.totalPlayTime !== undefined) {
      const total = (updatedCustomStats.get('totalPlayTime') || 0) + Number(stats.customStats.totalPlayTime);
      updatedCustomStats.set('totalPlayTime', total);
    }
  }
  
  const updated = {
    ...current,
    highscore: Math.max(current.highscore, stats.score || 0),
    coins: stats.coinsEarned ? (current.coins || 0) + stats.coinsEarned : current.coins,
    gamesPlayed: (current.gamesPlayed || 0) + 1,
    lastPlayed: new Date(),
    bestLevel: Math.max(current.bestLevel || 1, stats.level || 1),
    bestLines: Math.max(current.bestLines || 0, stats.lines || 0),
    customStats: updatedCustomStats
  };
  
  this.gameHighscores.set(gameName, updated);
  return updated;
};

// 🎮 Spaceship-specific helper methods
playerSchema.methods.getSpaceshipProfile = function() {
  const stats = this.getGameStats('spaceships');
  const customStats = stats.customStats || new Map();
  
  return {
    playerId: this._id.toString(),
    coins: stats.coins || 0, // Use existing coins, no default fallback
    totalAsteroidsDestroyed: customStats.get('totalAsteroidsDestroyed') || 0,
    totalPowerUpsCollected: customStats.get('totalPowerUpsCollected') || 0,
    gamesPlayed: stats.gamesPlayed || 0,
    bestScore: stats.highscore || 0,
    bestAccuracy: customStats.get('bestAccuracy') || 0,
    totalPlayTime: customStats.get('totalPlayTime') || 0,
    ownedShips: customStats.get('ownedShips') || ['basic'],
    ownedUpgrades: customStats.get('ownedUpgrades') || [],
    equippedShip: customStats.get('equippedShip') || 'basic',
    averageScore: stats.gamesPlayed > 0 ? Math.round(stats.highscore / stats.gamesPlayed) : 0,
    averageSurvivalTime: customStats.get('averageSurvivalTime') || 0,
    favoriteShip: customStats.get('favoriteShip') || 'basic'
  };
};

// 🏃‍♂️ Tilli Timian-specific helper methods
playerSchema.methods.getTilliProfile = function() {
  const stats = this.getGameStats('tillitimian');
  const customStats = stats.customStats || new Map();
  
  // Initialize default values if this is the first time accessing Tilli profile
  if (stats.gamesPlayed === 0 && stats.coins === 0) {
    stats.coins = 100; // Give starting coins
    customStats.set('highestLevelReached', 1);
    customStats.set('unlockedLevels', [1]);
    customStats.set('ownedSkins', ['classic']);
    customStats.set('equippedSkin', 'classic');
    customStats.set('ownedAbilities', []);
    customStats.set('totalGearsCollected', 0);
    customStats.set('totalEnemiesDefeated', 0);
    customStats.set('totalDeaths', 0);
    customStats.set('totalPlayTime', 0);
    customStats.set('levelCompletionTimes', new Map());
    customStats.set('perfectRuns', 0);
    customStats.set('fastestCompletion', null);
    customStats.set('favoriteLevel', 1);
    customStats.set('achievements', []);
    
    // Save the initialized values
    this.gameHighscores.set('tillitimian', stats);
  } else {
    // For existing players: Sync with Score collection to unlock levels
    this.syncTilliLevelsFromScores();
  }
  
  return {
    playerId: this._id.toString(),
    coins: stats.coins || 100,
    totalGearsCollected: customStats.get('totalGearsCollected') || 0,
    totalEnemiesDefeated: customStats.get('totalEnemiesDefeated') || 0,
    totalDeaths: customStats.get('totalDeaths') || 0,
    gamesPlayed: stats.gamesPlayed || 0,
    bestScore: stats.highscore || 0,
    highestLevelReached: customStats.get('highestLevelReached') || 1,
    unlockedLevels: customStats.get('unlockedLevels') || [1],
    ownedSkins: customStats.get('ownedSkins') || ['classic'],
    equippedSkin: customStats.get('equippedSkin') || 'classic',
    ownedAbilities: customStats.get('ownedAbilities') || [],
    totalPlayTime: customStats.get('totalPlayTime') || 0,
    levelCompletionTimes: customStats.get('levelCompletionTimes') || new Map(),
    perfectRuns: customStats.get('perfectRuns') || 0,
    fastestCompletion: customStats.get('fastestCompletion') || null,
    favoriteLevel: customStats.get('favoriteLevel') || 1,
    achievements: customStats.get('achievements') || []
  };
};

playerSchema.methods.updateTilliProfile = function(profileData) {
  const currentStats = this.getGameStats('tillitimian');
  const customStats = currentStats.customStats || new Map();
  
  // Update all profile fields in customStats
  Object.entries(profileData).forEach(([key, value]) => {
    if (key !== 'playerId') {
      if (key === 'levelCompletionTimes') {
        // Handle Map conversion properly
        if (value instanceof Map) {
          customStats.set(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Convert object to Map with string keys
          const mapValue = new Map();
          Object.entries(value).forEach(([mapKey, mapVal]) => {
            mapValue.set(String(mapKey), Number(mapVal));
          });
          customStats.set(key, mapValue);
        }
      } else if (key === 'unlockedLevels' && Array.isArray(value)) {
        // Ensure levels are unlocked in order and unique
        const uniqueLevels = [...new Set(value.map(Number))].sort((a, b) => a - b);
        customStats.set(key, uniqueLevels);
      } else {
        // Ensure proper type conversion
        customStats.set(key, value);
      }
    }
  });
  
  // Update coins in main stats
  if (profileData.coins !== undefined) {
    currentStats.coins = Math.max(0, Number(profileData.coins)); // Never go below 0
  }
  
  currentStats.customStats = customStats;
  this.gameHighscores.set('tillitimian', currentStats);
  
  return this.getTilliProfile();
};

// Helper method to unlock next level
playerSchema.methods.unlockTilliLevel = function(level) {
  const profile = this.getTilliProfile();
  const unlockedLevels = [...profile.unlockedLevels]; // Create a copy
  
  if (!unlockedLevels.includes(Number(level))) {
    unlockedLevels.push(Number(level));
    unlockedLevels.sort((a, b) => a - b);
    
    // Only update specific fields, not the entire profile
    const updatedProfile = {
      unlockedLevels,
      highestLevelReached: Math.max(profile.highestLevelReached, Number(level))
    };
    
    return this.updateTilliProfile(updatedProfile);
  }
  
  return profile;
};

// Helper method to purchase skin
playerSchema.methods.purchaseTilliSkin = function(skinId, cost) {
  const profile = this.getTilliProfile();
  
  if (profile.coins >= cost && !profile.ownedSkins.includes(skinId)) {
    const updatedProfile = {
      coins: profile.coins - cost,
      ownedSkins: [...profile.ownedSkins, skinId]
    };
    
    return { success: true, profile: this.updateTilliProfile(updatedProfile) };
  }
  
  return { success: false, reason: profile.coins < cost ? 'insufficient_coins' : 'already_owned' };
};

// Helper method to purchase ability
playerSchema.methods.purchaseTilliAbility = function(abilityId, cost) {
  const profile = this.getTilliProfile();
  
  if (profile.coins >= cost && !profile.ownedAbilities.includes(abilityId)) {
    const updatedProfile = {
      coins: profile.coins - cost,
      ownedAbilities: [...profile.ownedAbilities, abilityId]
    };
    
    return { success: true, profile: this.updateTilliProfile(updatedProfile) };
  }
  
  return { success: false, reason: profile.coins < cost ? 'insufficient_coins' : 'already_owned' };
};

// Sync Tilli levels from Score collection (intelligent level unlocking)
playerSchema.methods.syncTilliLevelsFromScores = async function() {
  try {
    const mongoose = require('mongoose');
    const Score = mongoose.model('Score');
    const playerScores = await Score.find({ 
      playerId: this._id, 
      gameName: 'tilliman' 
    }).sort({ level: -1 }).limit(1); // Get highest level reached
    
    if (playerScores.length > 0) {
      const highestLevel = playerScores[0].level;
      const profile = this.getTilliProfile();
      
      // Unlock all levels up to highest reached + 1
      const unlockedLevels = [];
      for (let i = 1; i <= Math.min(highestLevel + 1, 10); i++) {
        unlockedLevels.push(i);
      }
      
      // Update profile if needed
      if (unlockedLevels.length > profile.unlockedLevels.length) {
        this.updateTilliProfile({
          unlockedLevels,
          highestLevelReached: Math.max(profile.highestLevelReached, highestLevel)
        });
      }
    }
  } catch (error) {
    console.warn('Failed to sync Tilli levels from scores:', error);
  }
};

playerSchema.methods.updateSpaceshipProfile = function(profileData) {
  const currentStats = this.getGameStats('spaceships');
  const customStats = currentStats.customStats || new Map();
  
  // Update all profile fields in customStats
  Object.entries(profileData).forEach(([key, value]) => {
    if (key !== 'playerId') {
      customStats.set(key, value);
    }
  });
  
  // Update coins in main stats
  if (profileData.coins !== undefined) {
    currentStats.coins = profileData.coins;
  }
  
  currentStats.customStats = customStats;
  this.gameHighscores.set('spaceships', currentStats);
  
  return this.getSpaceshipProfile();
};

module.exports = mongoose.model('Player', playerSchema);
