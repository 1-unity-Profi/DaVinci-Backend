const axios = require('axios');

async function testTilliApi() {
  console.log('🧪 Testing Tilli Timian API...\n');
  
  const baseUrl = 'http://localhost:5000/api';
  const badgeId = 'dev-player-001';
  
  try {
    // Test 1: Create player if not exists
    console.log('1. Testing player creation...');
    try {
      await axios.post(`${baseUrl}/players`, {
        badgeId: badgeId,
        name: 'Test Player'
      });
      console.log('✅ Player created or already exists');
    } catch (error) {
      console.log('⚠️ Player already exists (expected)');
    }
    
    // Test 2: Get Tilli profile
    console.log('\n2. Testing Tilli profile...');
    try {
      const profileResponse = await axios.get(`${baseUrl}/players/badge/${badgeId}/tilli`);
      console.log('✅ Profile loaded:', JSON.stringify(profileResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Profile error:', error.response?.data || error.message);
    }
    
    // Test 3: Level complete (this is failing)
    console.log('\n3. Testing level complete...');
    try {
      const levelData = {
        level: 1,
        score: 1000,
        gearsCollected: 3,
        enemiesDefeated: 2,
        deaths: 0,
        playTime: 60,
        completionTime: 60
      };
      
      const response = await axios.post(`${baseUrl}/players/badge/${badgeId}/tilli/level-complete`, levelData);
      console.log('✅ Level complete success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Level complete ERROR:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Full error:', error.message);
      
      // Print detailed error info
      if (error.response?.data?.error) {
        console.log('Backend error message:', error.response.data.error);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testTilliApi().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  });
} 