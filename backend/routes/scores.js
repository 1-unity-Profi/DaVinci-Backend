const express = require('express');
const Score = require('../models/Score');
const Player = require('../models/Player');
const router = express.Router();

// Get all scores with player info
router.get('/', async (req, res) => {
  try {
    const scores = await Score.find()
      .populate('playerId', 'name badgeId')
      .sort({ score: -1 })
      .limit(50);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// Get scores by game - Enhanced for both Score-based and Player-based games
router.get('/game/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // For games that use the new Player-based highscore system (like spaceships)
    if (gameName === 'spaceships') {
      const players = await Player.find({
        [`gameHighscores.${gameName}`]: { $exists: true }
      }).sort({ [`gameHighscores.${gameName}.highscore`]: -1 })
        .limit(limit);
      
      const scores = players.map(player => {
        const gameStats = player.getGameStats(gameName);
        return {
          _id: player._id,
          playerId: {
            _id: player._id,
            name: player.name,
            badgeId: player.badgeId
          },
          score: gameStats.highscore || 0,
          level: gameStats.bestLevel || 1,
          duration: 0, // Not tracked in Player model
          createdAt: gameStats.lastPlayed || player.updatedAt,
          // Additional spaceship data for compatibility
          coins: gameStats.coins || 0,
          gamesPlayed: gameStats.gamesPlayed || 0
        };
      }).filter(entry => entry.score > 0);
      
      return res.json(scores);
    }
    
    // For Snake: Show only best score per player (like Spaceships)
    if (gameName === 'snake') {
      // Get all snake scores, grouped by player
      const allScores = await Score.find({ gameName })
        .populate('playerId', 'name badgeId')
        .sort({ score: -1 });
      
      // Group by player and keep only the best score for each
      const playerBestScores = new Map();
      
      allScores.forEach(score => {
        const playerId = score.playerId._id.toString();
        if (!playerBestScores.has(playerId) || 
            playerBestScores.get(playerId).score < score.score) {
          playerBestScores.set(playerId, score);
        }
      });
      
      // Convert back to array and sort by score
      const uniqueScores = Array.from(playerBestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return res.json(uniqueScores);
    }
    
    // For Tilli Timian: Show best level reached per player + scores
    if (gameName === 'tilliman') {
      // Get all tilliman scores, grouped by player showing best level + score
      const allScores = await Score.find({ gameName })
        .populate('playerId', 'name badgeId')
        .sort({ level: -1, score: -1 });
      
      // Group by player and keep the best level + score
      const playerBestProgress = new Map();
      
      allScores.forEach(score => {
        const playerId = score.playerId._id.toString();
        const current = playerBestProgress.get(playerId);
        
        if (!current || 
            current.level < score.level || 
            (current.level === score.level && current.score < score.score)) {
          playerBestProgress.set(playerId, score);
        }
      });
      
      // Convert back to array and sort by level first, then score
      const progressScores = Array.from(playerBestProgress.values())
        .sort((a, b) => {
          if (a.level !== b.level) return b.level - a.level; // Higher level first
          return b.score - a.score; // Then higher score
        })
        .slice(0, limit);
      
      return res.json(progressScores);
    }
    
    // For traditional games that use Score collection (like tetris) - show all scores
    const scores = await Score.find({ gameName })
      .populate('playerId', 'name badgeId')
      .sort({ score: -1 })
      .limit(limit);
    
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new score
router.post('/', async (req, res) => {
  try {
    const { playerId, gameName, score, level, duration } = req.body;
    
    // For Tilli Timian, also update player progression
    if (gameName === 'tilliman') {
      const player = await Player.findById(playerId);
      if (player) {
        // Update game stats in Player model as well
        const gameStats = {
          score: Number(score) || 0,
          level: Number(level) || 1,
          coinsEarned: Math.floor((Number(score) || 0) / 10) + 5, // Base coins for completing
          customStats: {
            totalPlayTime: Number(duration) || 0
          }
        };
        
        player.updateGameStats('tillitimian', gameStats);
        
        // Auto-unlock levels up to reached level
        const currentLevel = Number(level) || 1;
        for (let i = 1; i <= currentLevel + 1; i++) {
          player.unlockTilliLevel(i);
        }
        
        await player.save();
      }
    }
    
    const newScore = new Score({ playerId, gameName, score, level, duration });
    await newScore.save();
    
    await Player.findByIdAndUpdate(playerId, {
      $inc: { totalScore: score, gamesPlayed: 1 },
      lastPlayed: new Date()
    });
    
    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
