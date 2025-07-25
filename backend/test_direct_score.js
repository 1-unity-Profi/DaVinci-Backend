const axios = require('axios');

async function testDirectScore() {
  try {
    console.log('Testing direct score submission...');
    
    // First get player
    const playerResponse = await axios.get('http://localhost:5000/api/players/badge/dev-player-001');
    console.log('Player ID:', playerResponse.data._id);
    
    // Submit score directly
    const scoreData = {
      playerId: playerResponse.data._id,
      gameName: 'tilliman',
      score: 1500,
      level: 3,
      duration: 90
    };
    
    const scoreResponse = await axios.post('http://localhost:5000/api/scores', scoreData);
    console.log('✅ Score created:', scoreResponse.data);
    
    // Check scores
    const scoresResponse = await axios.get('http://localhost:5000/api/scores/game/tilliman');
    console.log('✅ Scores found:', scoresResponse.data.length);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDirectScore(); 