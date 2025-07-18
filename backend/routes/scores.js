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

// Get scores by game
router.get('/game/:gameName', async (req, res) => {
  try {
    const scores = await Score.find({ gameName: req.params.gameName })
      .populate('playerId', 'name badgeId')
      .sort({ score: -1 })
      .limit(10);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// Add new score
router.post('/', async (req, res) => {
  try {
    const { playerId, gameName, score, level, duration } = req.body;
    const newScore = new Score({ playerId, gameName, score, level, duration });
    await newScore.save();
    
    await Player.findByIdAndUpdate(playerId, {
      $inc: { totalScore: score, gamesPlayed: 1 },
      lastPlayed: new Date()
    });
    
    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

module.exports = router;
