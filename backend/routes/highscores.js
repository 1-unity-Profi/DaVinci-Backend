const express = require('express');
const Player = require('../models/Player');
const Score = require('../models/Score');
const router = express.Router();

// 🏆 Get Highscores für ein bestimmtes Game
router.get('/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // For Tilli Timian: Use Score collection with level progression focus
    if (gameName === 'tilliman') {
      const scores = await Score.find({ gameName })
        .populate('playerId', 'name badgeId')
        .sort({ level: -1, score: -1 }) // Level first, then score
        .limit(limit);
      
      const highscores = scores.map(score => ({
        _id: score._id,
        name: score.playerId.name,
        badgeId: score.playerId.badgeId,
        playerId: score.playerId._id,
        score: score.score,
        level: score.level,
        duration: score.duration,
        createdAt: score.createdAt,
        highscore: score.score, // For compatibility
        bestLevel: score.level   // For compatibility
      }));
      
      return res.json(highscores);
    }
    
    // For other games: Use Player gameHighscores
    const players = await Player.find({
      [`gameHighscores.${gameName}`]: { $exists: true }
    }).sort({ [`gameHighscores.${gameName}.highscore`]: -1 })
      .limit(limit);
    
    const highscores = players.map(player => {
      const gameStats = player.getGameStats(gameName);
      return {
        _id: player._id,
        name: player.name,
        badgeId: player.badgeId,
        playerId: player._id, // Add playerId for frontend compatibility
        ...gameStats
      };
    }).filter(entry => entry.highscore > 0);
    
    res.json(highscores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🎮 Submit Game Result - Enhanced for spaceship game
router.post('/submit', async (req, res) => {
  try {
    const { 
      playerId, 
      gameName, 
      score, 
      level, 
      lines, 
      coinsEarned, 
      duration,
      // Spaceship-specific stats
      asteroidsDestroyed,
      powerUpsCollected,
      accuracy,
      survivalTime,
      shipUsed
    } = req.body;
    
    if (!playerId || !gameName || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Prepare spaceship-specific custom stats
    const customStats = {};
    if (gameName === 'spaceships') {
      if (asteroidsDestroyed !== undefined) customStats.asteroidsDestroyed = asteroidsDestroyed;
      if (powerUpsCollected !== undefined) customStats.powerUpsCollected = powerUpsCollected;
      if (accuracy !== undefined) customStats.accuracy = accuracy;
      if (survivalTime !== undefined) customStats.survivalTime = survivalTime;
      if (shipUsed) customStats.shipUsed = shipUsed;
    }
    
    // Game-spezifische Stats updaten
    const gameStats = player.updateGameStats(gameName, {
      score,
      level,
      lines,
      coinsEarned,
      duration,
      customStats
    });
    
    // Globale Player-Stats updaten
    player.totalScore += score;
    player.gamesPlayed += 1;
    player.lastPlayed = new Date();
    
    await player.save();
    
    // Auch in die Score-Collection für detaillierte Historie
    const scoreRecord = new Score({
      playerId,
      gameName,
      score,
      level: level || 1,
      duration: duration || 0
    });
    await scoreRecord.save();
    
    res.json({
      success: true,
      gameStats,
      isNewHighscore: gameStats.highscore === score,
      coinsEarned: coinsEarned || 0
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🎯 Get Player-specific highscores for a game
router.get('/player/:playerId/:gameName', async (req, res) => {
  try {
    const { playerId, gameName } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    const scores = await Score.find({ 
      playerId, 
      gameName 
    })
    .populate('playerId', 'name badgeId')
    .sort({ score: -1 })
    .limit(limit);
    
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Spaceship-specific profile endpoint
router.get('/profile/:playerId/spaceships', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const profile = player.getSpaceshipProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛠️ Update spaceship profile
router.post('/profile/:playerId/spaceships', async (req, res) => {
  try {
    const { playerId } = req.params;
    const profileData = req.body;
    
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const updatedProfile = player.updateSpaceshipProfile(profileData);
    await player.save();
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 Spaceship Analytics
router.get('/analytics/spaceships/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const spaceshipStats = player.getGameStats('spaceships');
    const scores = await Score.find({ playerId, gameName: 'spaceships' })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const analytics = {
      totalGames: spaceshipStats.gamesPlayed || 0,
      bestScore: spaceshipStats.highscore || 0,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0,
      improvement: scores.length >= 2 ? scores[0].score - scores[scores.length - 1].score : 0,
      recentGames: scores.slice(0, 5),
      playTime: spaceshipStats.customStats?.get('totalPlayTime') || 0,
      coins: spaceshipStats.coins || 1000
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🏅 Leaderboards by category
router.get('/leaderboard/spaceships/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    let sortField;
    switch (category) {
      case 'score':
        sortField = 'gameHighscores.spaceships.highscore';
        break;
      case 'accuracy':
        sortField = 'gameHighscores.spaceships.customStats.bestAccuracy';
        break;
      case 'survival':
        sortField = 'gameHighscores.spaceships.customStats.averageSurvivalTime';
        break;
      default:
        sortField = 'gameHighscores.spaceships.highscore';
    }
    
    const players = await Player.find({
      'gameHighscores.spaceships': { $exists: true }
    }).sort({ [sortField]: -1 }).limit(limit);
    
    const leaderboard = players.map(player => {
      const gameStats = player.getGameStats('spaceships');
      const customStats = gameStats.customStats || new Map();
      
      return {
        _id: player._id,
        name: player.name,
        badgeId: player.badgeId,
        score: gameStats.highscore || 0,
        accuracy: customStats.get('bestAccuracy') || 0,
        survivalTime: customStats.get('averageSurvivalTime') || 0,
        gamesPlayed: gameStats.gamesPlayed || 0
      };
    }).filter(entry => entry.score > 0);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
