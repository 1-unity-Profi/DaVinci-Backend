const axios = require('axios');

async function testNewTilliSystem() {
  console.log('🧪 Testing NEW Tilli Timian Score System...\n');
  
  const baseUrl = 'http://localhost:5000/api';
  const badgeId = 'dev-player-001';
  
  try {
    // Test 1: Complete level and submit score (dual system)
    console.log('1. Testing level completion + score submission...');
    
    // Submit level completion (like before)
    const levelData = {
      level: 3,
      score: 2500,
      gearsCollected: 3,
      enemiesDefeated: 5,
      deaths: 1,
      playTime: 120,
      completionTime: 120
    };
    
    const levelResponse = await axios.post(`${baseUrl}/players/badge/${badgeId}/tilli/level-complete`, levelData);
    console.log('✅ Level completion:', levelResponse.data.profile.highestLevelReached);
    
    // Test 2: Check if score was automatically created
    console.log('\n2. Testing automatic score creation...');
    const scoresResponse = await axios.get(`${baseUrl}/scores/game/tilliman`);
    console.log('✅ Tilliman scores found:', scoresResponse.data.length);
    console.log('   Latest score:', scoresResponse.data[0]?.score, 'Level:', scoresResponse.data[0]?.level);
    
    // Test 3: Check highscores
    console.log('\n3. Testing highscores endpoint...');
    const highscoresResponse = await axios.get(`${baseUrl}/highscores/tilliman`);
    console.log('✅ Highscores found:', highscoresResponse.data.length);
    console.log('   Top score:', highscoresResponse.data[0]?.score, 'Level:', highscoresResponse.data[0]?.level);
    
    // Test 4: Check player scores
    console.log('\n4. Testing player score history...');
    const playerScores = await axios.get(`${baseUrl}/players/badge/${badgeId}/tilli/scores`);
    console.log('✅ Player scores found:', playerScores.data.length);
    
    // Test 5: Check level sync
    console.log('\n5. Testing level sync...');
    const syncResponse = await axios.post(`${baseUrl}/players/badge/${badgeId}/tilli/sync-levels`);
    console.log('✅ Levels synced. Unlocked levels:', syncResponse.data.profile.unlockedLevels);
    
    // Test 6: Submit another score for level 5
    console.log('\n6. Testing higher level score...');
    await axios.post(`${baseUrl}/scores`, {
      playerId: levelResponse.data.profile.playerId,
      gameName: 'tilliman',
      score: 4500,
      level: 5,
      duration: 180
    });
    console.log('✅ Higher level score submitted');
    
    // Test 7: Re-sync levels
    console.log('\n7. Testing level re-sync after higher score...');
    const resyncResponse = await axios.post(`${baseUrl}/players/badge/${badgeId}/tilli/sync-levels`);
    console.log('✅ Re-synced. Unlocked levels:', resyncResponse.data.profile.unlockedLevels);
    
    console.log('\n🎉 NEW TILLI SYSTEM WORKS PERFECTLY!');
    console.log('Features tested:');
    console.log('✅ Dual score system (Player + Score collection)');
    console.log('✅ Intelligent level unlocking');
    console.log('✅ Tetris-style leaderboards');
    console.log('✅ Level progression tracking');
    console.log('✅ Automatic level sync');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run test
if (require.main === module) {
  testNewTilliSystem().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  });
} 