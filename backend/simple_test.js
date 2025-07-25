const axios = require('axios');

async function simpleTest() {
  try {
    console.log('Testing backend...');
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend running:', response.data);
    
    // Test player creation
    try {
      const playerResponse = await axios.post('http://localhost:5000/api/players', {
        badgeId: 'test-001',
        name: 'Test User'
      });
      console.log('✅ Player created');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Player already exists');
      } else {
        console.log('❌ Player creation error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Backend not running:', error.message);
  }
}

simpleTest(); 