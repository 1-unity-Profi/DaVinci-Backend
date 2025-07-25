const express = require('express');
const Player = require('../models/Player');
const router = express.Router();

// Helper function to get or create player
async function getOrCreatePlayer(badgeId) {
  let player = await Player.findOne({ badgeId });
  
  if (!player) {
    console.log(`Auto-creating player for badge: ${badgeId}`);
    player = new Player({
      badgeId,
      name: `Player-${badgeId.slice(-6)}`,
      totalScore: 0,
      gamesPlayed: 0,
      lastPlayed: new Date()
    });
    await player.save();
  }
  
  return player;
}

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find().sort({ totalScore: -1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player by badge ID - SPEZIFISCHER PFAD ZUERST
router.get('/badge/:badgeId', async (req, res) => {
  try {
    const player = await Player.findOne({ badgeId: req.params.badgeId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    } // ✅ FEHLTE: Diese Klammer
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// Get player by ID - ALLGEMEINER PFAD DANACH
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    } // ✅ FEHLTE: Diese Klammer
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// Create new player
router.post('/', async (req, res) => {
  try {
    const { badgeId, name } = req.body;
    const existingPlayer = await Player.findOne({ badgeId });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player with this badge ID already exists' });
    } // ✅ FEHLTE: Diese Klammer
    const player = new Player({ badgeId, name });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// 🏃‍♂️ Tilli Timian-specific routes

// Get Tilli profile by badge ID (auto-create if not exists)
router.get('/badge/:badgeId/tilli', async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.params.badgeId);
    const profile = player.getTilliProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Tilli profile
router.put('/badge/:badgeId/tilli', async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.params.badgeId);
    const updatedProfile = player.updateTilliProfile(req.body);
    await player.save();
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update game stats after completing a level (auto-create if not exists)
router.post('/badge/:badgeId/tilli/level-complete', async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.params.badgeId);
    
    const { level, score, gearsCollected, enemiesDefeated, deaths, playTime, completionTime } = req.body;
    console.log('Level complete data:', { level, score, gearsCollected, enemiesDefeated, deaths, playTime, completionTime });
    
    // Update game stats
    const gameStats = {
      score: Number(score) || 0,
      level: Number(level) || 1,
      coinsEarned: Math.floor((Number(score) || 0) / 10) + (Number(gearsCollected) || 0) * 5, // 1 coin per 10 points + 5 per gear
      customStats: {
        totalGearsCollected: Number(gearsCollected) || 0,
        totalEnemiesDefeated: Number(enemiesDefeated) || 0,
        totalDeaths: Number(deaths) || 0,
        totalPlayTime: Number(playTime) || 0
      }
    };
    
    console.log('Calling updateGameStats with:', gameStats);
    player.updateGameStats('tillitimian', gameStats);
    
    // Unlock all levels up to and including next level
    if (level) {
      const currentLevel = Number(level);
      console.log('Unlocking levels up to:', currentLevel + 1);
      
      // Unlock all levels from 1 to current+1
      for (let i = 1; i <= currentLevel + 1; i++) {
        player.unlockTilliLevel(i);
      }
    }
    
    // Skip completion time update for now to isolate the issue
    /*
    // Update completion time for this level
    const profile = player.getTilliProfile();
    const completionTimes = profile.levelCompletionTimes instanceof Map 
      ? profile.levelCompletionTimes 
      : new Map(Object.entries(profile.levelCompletionTimes || {}));
      
    if (completionTime && level) {
      const levelKey = String(level); // Ensure level is a string key
      if (!completionTimes.has(levelKey) || completionTimes.get(levelKey) > completionTime) {
        completionTimes.set(levelKey, Number(completionTime));
        player.updateTilliProfile({ levelCompletionTimes: completionTimes });
      }
    }
    */
    
    console.log('Saving player...');
    await player.save();
    
    console.log('Getting final profile...');
    const finalProfile = player.getTilliProfile();
    
    res.json({
      profile: finalProfile,
      coinsEarned: gameStats.coinsEarned
    });
  } catch (error) {
    console.error('Level complete error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Purchase skin
router.post('/badge/:badgeId/tilli/shop/skin', async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.params.badgeId);
    
    const { skinId, cost } = req.body;
    const result = player.purchaseTilliSkin(skinId, cost);
    
    if (result.success) {
      await player.save();
      res.json({ success: true, profile: result.profile });
    } else {
      res.status(400).json({ success: false, reason: result.reason });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase ability
router.post('/badge/:badgeId/tilli/shop/ability', async (req, res) => {
  try {
    const player = await Player.findOne({ badgeId: req.params.badgeId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const { abilityId, cost } = req.body;
    const result = player.purchaseTilliAbility(abilityId, cost);
    
    if (result.success) {
      await player.save();
      res.json({ success: true, profile: result.profile });
    } else {
      res.status(400).json({ success: false, reason: result.reason });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Equip skin
router.put('/badge/:badgeId/tilli/equip-skin', async (req, res) => {
  try {
    const player = await Player.findOne({ badgeId: req.params.badgeId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const { skinId } = req.body;
    const profile = player.getTilliProfile();
    
    if (profile.ownedSkins.includes(skinId)) {
      const updatedProfile = player.updateTilliProfile({ equippedSkin: skinId });
      await player.save();
      res.json(updatedProfile);
    } else {
      res.status(400).json({ error: 'Skin not owned' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard for Tilli Timian
router.get('/tilli/leaderboard', async (req, res) => {
  try {
    const players = await Player.find({});
    const leaderboard = players
      .map(player => {
        const profile = player.getTilliProfile();
        return {
          name: player.name,
          badgeId: player.badgeId,
          bestScore: profile.bestScore,
          highestLevel: profile.highestLevelReached,
          totalGears: profile.totalGearsCollected,
          gamesPlayed: profile.gamesPlayed
        };
      })
      .filter(entry => entry.gamesPlayed > 0)
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Tilli Timian scores for a player (Tetris-style)
router.get('/badge/:badgeId/tilli/scores', async (req, res) => {
  try {
    console.log('Getting Tilli scores for badge:', req.params.badgeId);
    const player = await Player.findOne({ badgeId: req.params.badgeId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const Score = require('../models/Score');
    const scores = await Score.find({ 
      playerId: player._id, 
      gameName: 'tilliman' 
    }).sort({ level: -1, score: -1 }).limit(20);
    
    console.log('Found scores:', scores.length);
    res.json(scores);
  } catch (error) {
    console.error('Error getting Tilli scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync player levels from scores (manual trigger)
router.post('/badge/:badgeId/tilli/sync-levels', async (req, res) => {
  try {
    const player = await Player.findOne({ badgeId: req.params.badgeId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    await player.syncTilliLevelsFromScores();
    await player.save();
    
    res.json({
      success: true,
      profile: player.getTilliProfile()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
