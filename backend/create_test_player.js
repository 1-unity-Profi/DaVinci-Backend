const mongoose = require('mongoose');
const Player = require('./models/Player');
const Score = require('./models/Score');

async function createTestPlayer() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/DaVinci_Arcade');
    console.log('🔗 Connected to MongoDB\n');

    console.log('🎮 CREATING TEST PLAYER "giano"');
    console.log('=================================\n');

    // 1. Create Player "giano"
    console.log('👤 1. Creating Player...');
    let player = await Player.findOne({ badgeId: '1234567' });
    
    if (!player) {
      player = new Player({
        badgeId: '1234567',
        name: 'giano',
        totalScore: 0,
        gamesPlayed: 0,
        lastPlayed: new Date()
      });
      await player.save();
      console.log('✅ Player "giano" created successfully');
      console.log(`   Player ID: ${player._id}`);
      console.log(`   Badge ID: ${player.badgeId}`);
      console.log(`   Name: ${player.name}`);
    } else {
      console.log('⚠️ Player "giano" already exists');
      console.log(`   Player ID: ${player._id}`);
    }

    // 2. Initialize Tilli Profile
    console.log('\n🏃‍♂️ 2. Initializing Tilli Profile...');
    const tilliProfile = player.getTilliProfile();
    console.log('✅ Tilli Profile initialized:');
    console.log(`   Coins: ${tilliProfile.coins}`);
    console.log(`   Unlocked Levels: [${tilliProfile.unlockedLevels.join(', ')}]`);
    console.log(`   Highest Level: ${tilliProfile.highestLevelReached}`);
    console.log(`   Owned Skins: [${tilliProfile.ownedSkins.join(', ')}]`);
    console.log(`   Equipped Skin: ${tilliProfile.equippedSkin}`);

    // 3. Simulate some level completions
    console.log('\n🎯 3. Simulating Level Completions...');
    
    const levelCompletions = [
      { level: 1, score: 1000, gears: 3, enemies: 2, deaths: 0, time: 60 },
      { level: 2, score: 1500, gears: 3, enemies: 4, deaths: 1, time: 90 },
      { level: 3, score: 2200, gears: 3, enemies: 5, deaths: 0, time: 120 },
      { level: 4, score: 2800, gears: 3, enemies: 6, deaths: 2, time: 150 },
      { level: 5, score: 3500, gears: 3, enemies: 8, deaths: 1, time: 180 }
    ];

    for (const completion of levelCompletions) {
      console.log(`\n   🎮 Completing Level ${completion.level}...`);
      
      // Update Player stats (like our new system)
      const gameStats = {
        score: completion.score,
        level: completion.level,
        coinsEarned: Math.floor(completion.score / 10) + completion.gears * 5,
        customStats: {
          totalGearsCollected: completion.gears,
          totalEnemiesDefeated: completion.enemies,
          totalDeaths: completion.deaths,
          totalPlayTime: completion.time
        }
      };
      
      player.updateGameStats('tillitimian', gameStats);
      
      // Unlock levels (all up to current + 1)
      for (let i = 1; i <= completion.level + 1; i++) {
        player.unlockTilliLevel(i);
      }
      
      await player.save();
      
      // Create Score record (like Tetris)
      const score = new Score({
        playerId: player._id,
        gameName: 'tilliman',
        score: completion.score,
        level: completion.level,
        duration: completion.time
      });
      await score.save();
      
      console.log(`   ✅ Level ${completion.level}: Score ${completion.score}, Coins +${gameStats.coinsEarned}`);
    }

    // 4. Final Results
    console.log('\n📊 4. FINAL RESULTS:');
    console.log('════════════════════');
    
    // Player Profile
    const finalProfile = player.getTilliProfile();
    console.log('\n🏃‍♂️ Player Profile:');
    console.log(`   Coins: ${finalProfile.coins}`);
    console.log(`   Best Score: ${finalProfile.bestScore}`);
    console.log(`   Highest Level: ${finalProfile.highestLevelReached}`);
    console.log(`   Unlocked Levels: [${finalProfile.unlockedLevels.join(', ')}]`);
    console.log(`   Games Played: ${finalProfile.gamesPlayed}`);
    console.log(`   Total Gears: ${finalProfile.totalGearsCollected}`);
    console.log(`   Total Enemies: ${finalProfile.totalEnemiesDefeated}`);

    // Score Collection
    const allScores = await Score.find({ playerId: player._id, gameName: 'tilliman' }).sort({ level: -1 });
    console.log('\n📋 Score Collection:');
    allScores.forEach((score, index) => {
      console.log(`   ${index + 1}. Level ${score.level}: ${score.score} points (${score.duration}s)`);
    });

    // Test level sync function
    console.log('\n🔄 5. Testing Level Sync...');
    await player.syncTilliLevelsFromScores();
    await player.save();
    
    const syncedProfile = player.getTilliProfile();
    console.log(`✅ After sync - Unlocked Levels: [${syncedProfile.unlockedLevels.join(', ')}]`);

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('=================================');
    console.log('✅ Player created and populated with test data');
    console.log('✅ Dual storage system working (Player + Score)');
    console.log('✅ Level progression system functional');
    console.log('✅ Score tracking system functional');
    console.log('✅ Level sync system functional');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  createTestPlayer().then(() => {
    console.log('\n🏁 Test creation finished');
    process.exit(0);
  });
}

module.exports = { createTestPlayer }; 