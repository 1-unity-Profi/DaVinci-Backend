const express = require('express');
const Player = require('../models/Player');
const router = express.Router();

// 🏆 Get Highscores für ein bestimmtes Game
router.get('/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
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
        ...gameStats
      };
    }).filter(entry => entry.highscore > 0);
    
    res.json(highscores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

// 🎮 Submit Game Result
router.post('/submit', async (req, res) => {
  try {
    const { playerId, gameName, score, level, lines, coinsEarned, duration } = req.body;
    
    if (!playerId || !gameName || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    } // ✅ FEHLTE: Diese Klammer
    
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    } // ✅ FEHLTE: Diese Klammer
    
    // Game-spezifische Stats updaten
    const gameStats = player.updateGameStats(gameName, {
      score,
      level,
      lines,
      coinsEarned,
      duration
    });
    
    // Globale Player-Stats updaten
    player.totalScore += score;
    player.gamesPlayed += 1;
    player.lastPlayed = new Date();
    
    await player.save();
    
    // Auch in die Score-Collection für detaillierte Historie
    const Score = require('../models/Score');
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
      isNewHighscore: gameStats.highscore === score
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  } // ✅ FEHLTE: Diese Klammer
});

module.exports = router;
