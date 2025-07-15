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

// Get player by badge ID
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