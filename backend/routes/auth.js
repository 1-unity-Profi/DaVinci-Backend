const express = require('express');
const Player = require('../models/Player');
const router = express.Router();

// Badge login
router.post('/badge-login', async (req, res) => {
  try {
    const { badgeId } = req.body;
    let player = await Player.findOne({ badgeId });
    if (!player) {
      player = new Player({
        badgeId,
        name: `Player ${badgeId.slice(-4)}`,
        lastPlayed: new Date()
      });
      await player.save();
    } else {
      player.lastPlayed = new Date();
      await player.save();
    }
    res.json({
      success: true,
      player,
      message: player.gamesPlayed === 0 ? 'Welcome new player!' : 'Welcome back!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 