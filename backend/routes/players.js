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

module.exports = router;
