const express = require('express');
const Player = require('../models/Player');
const router = express.Router();

// Badge login - überarbeitet
router.post('/badge-login', async (req, res) => {
  try {
    const { badgeId } = req.body;
    const player = await Player.findOne({ badgeId });

    if (!player) {
      // Player existiert nicht - Frontend soll Username-Formular zeigen
      return res.json({
        success: false,
        requiresUsername: true,
        badgeId: badgeId,
        message: 'Badge nicht im System gefunden'
      });
    } // ✅ FEHLTE: Diese Klammer

    // Player existiert - Update lastPlayed
    player.lastPlayed = new Date();
    await player.save();

    res.json({
      success: true,
      requiresUsername: false,
      player,
      message: player.gamesPlayed === 0 ? 'Willkommen!' : 'Willkommen zurück!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// Neuer Endpoint für Registrierung mit Username
router.post('/register-with-badge', async (req, res) => {
  try {
    const { badgeId, username } = req.body;

    // Prüfe ob Badge bereits existiert
    const existingPlayer = await Player.findOne({ badgeId });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Badge bereits registriert' });
    } // ✅ FEHLTE: Diese Klammer

    // Erstelle neuen Player
    const player = new Player({
      badgeId,
      name: username,
      lastPlayed: new Date()
    });

    await player.save();

    res.json({
      success: true,
      player,
      message: 'Erfolgreich registriert!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

module.exports = router;
