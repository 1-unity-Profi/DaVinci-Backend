const mongoose = require('mongoose');
const Player = require('./models/Player');
const Score = require('./models/Score');

async function queryPlayerData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/DaVinci_Arcade');
    console.log('🔗 Connected to MongoDB\n');

    const playerId = '68822a4fd7ae0e20afe21d5a';
    const badgeId = '1234567';

    console.log('📊 QUERYING DATA FOR PLAYER "giano"');
    console.log('=====================================\n');

    // 1. Query Player Collection
    console.log('🎮 1. PLAYER COLLECTION DATA:');
    console.log('─────────────────────────────');
    
    const player = await Player.findOne({ _id: playerId });
    if (player) {
      console.log('✅ Player found:');
      console.log('   Name:', player.name);
      console.log('   Badge ID:', player.badgeId);
      console.log('   Total Score:', player.totalScore);
      console.log('   Games Played:', player.gamesPlayed);
      console.log('   Last Played:', player.lastPlayed);
      console.log('   Created:', player.createdAt);
      
      // Check gameHighscores Map
      console.log('\n🏆 Game Highscores:');
      if (player.gameHighscores && player.gameHighscores.size > 0) {
        for (const [gameName, stats] of player.gameHighscores) {
          console.log(`   ${gameName}:`, JSON.stringify(stats, null, 4));
        }
      } else {
        console.log('   No game highscores found');
      }

      // Check Tilli Profile specifically
      console.log('\n🏃‍♂️ Tilli Timian Profile:');
      try {
        const tilliProfile = player.getTilliProfile();
        console.log('   Coins:', tilliProfile.coins);
        console.log('   Highest Level:', tilliProfile.highestLevelReached);
        console.log('   Unlocked Levels:', tilliProfile.unlockedLevels);
        console.log('   Games Played:', tilliProfile.gamesPlayed);
        console.log('   Best Score:', tilliProfile.bestScore);
        console.log('   Owned Skins:', tilliProfile.ownedSkins);
        console.log('   Equipped Skin:', tilliProfile.equippedSkin);
        console.log('   Owned Abilities:', tilliProfile.ownedAbilities);
      } catch (error) {
        console.log('   Error getting Tilli profile:', error.message);
      }
      
    } else {
      console.log('❌ Player not found');
    }

    // 2. Query Score Collection
    console.log('\n\n📋 2. SCORE COLLECTION DATA:');
    console.log('─────────────────────────────');
    
    // All scores for this player
    const allScores = await Score.find({ playerId: playerId }).populate('playerId', 'name badgeId').sort({ createdAt: -1 });
    console.log(`✅ Total scores found: ${allScores.length}`);
    
    if (allScores.length > 0) {
      console.log('\n📊 All Scores:');
      allScores.forEach((score, index) => {
        console.log(`   ${index + 1}. Game: ${score.gameName}, Score: ${score.score}, Level: ${score.level}, Duration: ${score.duration}s, Date: ${score.createdAt}`);
      });
    }

    // Tilliman scores specifically
    console.log('\n🏃‍♂️ Tilliman Scores:');
    const tillimanScores = await Score.find({ playerId: playerId, gameName: 'tilliman' }).sort({ level: -1, score: -1 });
    console.log(`✅ Tilliman scores found: ${tillimanScores.length}`);
    
    if (tillimanScores.length > 0) {
      tillimanScores.forEach((score, index) => {
        console.log(`   ${index + 1}. Level: ${score.level}, Score: ${score.score}, Duration: ${score.duration}s, Date: ${score.createdAt}`);
      });

      // Best level reached
      const bestLevel = Math.max(...tillimanScores.map(s => s.level));
      const bestScore = Math.max(...tillimanScores.map(s => s.score));
      console.log(`\n🏆 Best Performance:`);
      console.log(`   Highest Level: ${bestLevel}`);
      console.log(`   Best Score: ${bestScore}`);
    } else {
      console.log('   No Tilliman scores found');
    }

    // 3. Check what levels should be unlocked
    console.log('\n\n🔓 3. LEVEL UNLOCK ANALYSIS:');
    console.log('──────────────────────────────');
    
    if (tillimanScores.length > 0) {
      const maxLevel = Math.max(...tillimanScores.map(s => s.level));
      const shouldUnlock = [];
      for (let i = 1; i <= Math.min(maxLevel + 1, 10); i++) {
        shouldUnlock.push(i);
      }
      console.log(`   Based on scores, should unlock levels: [${shouldUnlock.join(', ')}]`);
      
      if (player) {
        const currentProfile = player.getTilliProfile();
        console.log(`   Currently unlocked levels: [${currentProfile.unlockedLevels.join(', ')}]`);
        
        const needsSync = shouldUnlock.length > currentProfile.unlockedLevels.length;
        console.log(`   Needs level sync: ${needsSync ? '✅ YES' : '❌ NO'}`);
      }
    }

    console.log('\n✅ Query completed successfully!');

  } catch (error) {
    console.error('❌ Error querying data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the query
if (require.main === module) {
  queryPlayerData().then(() => {
    console.log('\n🏁 Query finished');
    process.exit(0);
  });
}

module.exports = { queryPlayerData }; 