const express = require('express');
const Player = require('../models/Player');
const router = express.Router();

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
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEU: Get player stats for Snake - WICHTIG FÜR SNAKE SYSTEM
router.get('/:id/stats', async (req, res) => {
  try {
    const playerId = req.params.id;
    console.log('🐍 Loading stats for player:', playerId);

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get Snake scores from Score collection
    const Score = require('../models/Score');
    const snakeScores = await Score.find({
      playerId,
      gameName: 'snake'
    }).sort({ score: -1 });

    console.log('🐍 Found Snake scores:', snakeScores.length);

    const snakeHighscore = snakeScores.length > 0 ? snakeScores[0].score : 0;

    const stats = {
      totalScore: player.totalScore || 0,
      gamesPlayed: player.gamesPlayed || 0,
      snakeHighscore,
      snakeFruits: Math.max(10, Math.floor(snakeHighscore / 2) + 10), // Base + Bonus
      snakeGamesPlayed: snakeScores.length
    };

    console.log('🐍 Returning stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID - ALLGEMEINER PFAD DANACH
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new player
router.post('/', async (req, res) => {
  try {
    const { badgeId, name } = req.body;
    const existingPlayer = await Player.findOne({ badgeId });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player with this badge ID already exists' });
    }
    const player = new Player({ badgeId, name });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
