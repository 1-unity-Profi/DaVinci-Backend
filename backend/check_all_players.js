const mongoose = require('mongoose');
const Player = require('./models/Player');
const Score = require('./models/Score');

async function checkAllPlayers() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/DaVinci_Arcade');
    console.log('🔗 Connected to MongoDB\n');

    console.log('📊 CHECKING ALL DATA IN DATABASE');
    console.log('=================================\n');

    // 1. List all players
    console.log('🎮 1. ALL PLAYERS IN DATABASE:');
    console.log('───────────────────────────────');
    
    const allPlayers = await Player.find({}).sort({ createdAt: -1 });
    console.log(`✅ Total players found: ${allPlayers.length}\n`);
    
    if (allPlayers.length > 0) {
      allPlayers.forEach((player, index) => {
        console.log(`   ${index + 1}. Player:`);
        console.log(`      ID: ${player._id}`);
        console.log(`      Name: ${player.name}`);
        console.log(`      Badge ID: ${player.badgeId}`);
        console.log(`      Total Score: ${player.totalScore}`);
        console.log(`      Games Played: ${player.gamesPlayed}`);
        console.log(`      Created: ${player.createdAt}`);
        console.log(`      Game Highscores: ${player.gameHighscores?.size || 0} games`);
        
        // Check if this player has Tilli data
        if (player.gameHighscores?.has('tillitimian')) {
          const tilliStats = player.gameHighscores.get('tillitimian');
          console.log(`      📊 Tilli Stats: Level ${tilliStats.bestLevel}, Score ${tilliStats.highscore}, Coins ${tilliStats.coins}`);
        }
        console.log('');
      });
    } else {
      console.log('   No players found in database');
    }

    // 2. List all scores
    console.log('\n📋 2. ALL SCORES IN DATABASE:');
    console.log('─────────────────────────────');
    
    const allScores = await Score.find({}).populate('playerId', 'name badgeId').sort({ createdAt: -1 });
    console.log(`✅ Total scores found: ${allScores.length}\n`);
    
    if (allScores.length > 0) {
      allScores.forEach((score, index) => {
        console.log(`   ${index + 1}. Score:`);
        console.log(`      ID: ${score._id}`);
        console.log(`      Player: ${score.playerId?.name || 'Unknown'} (${score.playerId?.badgeId || 'No Badge'})`);
        console.log(`      Game: ${score.gameName}`);
        console.log(`      Score: ${score.score}`);
        console.log(`      Level: ${score.level}`);
        console.log(`      Duration: ${score.duration}s`);
        console.log(`      Date: ${score.createdAt}`);
        console.log('');
      });

      // Group by game
      const gameStats = {};
      allScores.forEach(score => {
        if (!gameStats[score.gameName]) {
          gameStats[score.gameName] = [];
        }
        gameStats[score.gameName].push(score);
      });

      console.log('📊 SCORES BY GAME:');
      for (const [gameName, scores] of Object.entries(gameStats)) {
        console.log(`   ${gameName}: ${scores.length} scores`);
      }
    } else {
      console.log('   No scores found in database');
    }

    // 3. Check target player specifically
    console.log('\n\n🔍 3. CHECKING TARGET PLAYER:');
    console.log('──────────────────────────────');
    
    const targetId = '68822a4fd7ae0e20afe21d5a';
    const targetBadge = '1234567';
    
    console.log(`Looking for Player ID: ${targetId}`);
    console.log(`Looking for Badge ID: ${targetBadge}\n`);
    
    // Try by ObjectId
    let targetPlayer = null;
    try {
      targetPlayer = await Player.findOne({ _id: targetId });
      if (targetPlayer) {
        console.log('✅ Found by Player ID');
      } else {
        console.log('❌ Not found by Player ID');
      }
    } catch (error) {
      console.log('❌ Error finding by Player ID:', error.message);
    }
    
    // Try by Badge ID
    if (!targetPlayer) {
      targetPlayer = await Player.findOne({ badgeId: targetBadge });
      if (targetPlayer) {
        console.log('✅ Found by Badge ID');
        console.log(`   Actual Player ID: ${targetPlayer._id}`);
      } else {
        console.log('❌ Not found by Badge ID');
      }
    }

    // Try by name
    if (!targetPlayer) {
      targetPlayer = await Player.findOne({ name: 'giano' });
      if (targetPlayer) {
        console.log('✅ Found by Name');
        console.log(`   Actual Player ID: ${targetPlayer._id}`);
        console.log(`   Actual Badge ID: ${targetPlayer.badgeId}`);
      } else {
        console.log('❌ Not found by Name "giano"');
      }
    }

    console.log('\n✅ Check completed successfully!');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the check
if (require.main === module) {
  checkAllPlayers().then(() => {
    console.log('\n🏁 Check finished');
    process.exit(0);
  });
}

module.exports = { checkAllPlayers }; 