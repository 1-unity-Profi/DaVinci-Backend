const mongoose = require('mongoose');
const Player = require('./models/Player');
const Score = require('./models/Score');

async function testUnifiedHighscores() {
    console.log('🧪 Testing Unified Highscore System...\n');
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arcade', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        
        // Test 1: Create a test player
        let testPlayer = await Player.findOne({ badgeId: 'TEST_001' });
        if (!testPlayer) {
            testPlayer = new Player({
                badgeId: 'TEST_001',
                name: 'TestPlayer'
            });
            await testPlayer.save();
            console.log('✅ Created test player');
        }
        
        // Test 2: Add a spaceship highscore using Player model
        const spaceshipStats = testPlayer.updateGameStats('spaceships', {
            score: 1500,
            level: 5,
            coinsEarned: 15,
            customStats: {
                asteroidsDestroyed: 25,
                accuracy: 85,
                shipUsed: 'destroyer'
            }
        });
        await testPlayer.save();
        console.log('✅ Added spaceship score to Player model:', spaceshipStats.highscore);
        
        // Test 3: Add a tetris score using Score model
        const tetrisScore = new Score({
            playerId: testPlayer._id,
            gameName: 'tetris',
            score: 2500,
            level: 3,
            duration: 300
        });
        await tetrisScore.save();
        console.log('✅ Added tetris score to Score model:', tetrisScore.score);
        
        // Test 4: Test unified API response for spaceships
        const spaceshipScores = await fetch('http://localhost:5000/api/scores/game/spaceships')
            .then(res => res.json())
            .catch(err => ({ error: err.message }));
        
        console.log('\n📊 Spaceship Scores API Response:');
        if (spaceshipScores.error) {
            console.log('❌ Error:', spaceshipScores.error);
        } else {
            console.log('✅ Found', spaceshipScores.length, 'spaceship scores');
            if (spaceshipScores.length > 0) {
                console.log('   First entry structure:', {
                    _id: spaceshipScores[0]._id ? '✅' : '❌',
                    playerId: spaceshipScores[0].playerId ? '✅' : '❌',
                    score: spaceshipScores[0].score ? '✅' : '❌',
                    level: spaceshipScores[0].level ? '✅' : '❌',
                    coins: spaceshipScores[0].coins ? '✅' : '❌'
                });
            }
        }
        
        // Test 5: Test traditional API response for tetris
        const tetrisScores = await fetch('http://localhost:5000/api/scores/game/tetris')
            .then(res => res.json())
            .catch(err => ({ error: err.message }));
        
        console.log('\n🎮 Tetris Scores API Response:');
        if (tetrisScores.error) {
            console.log('❌ Error:', tetrisScores.error);
        } else {
            console.log('✅ Found', tetrisScores.length, 'tetris scores');
            if (tetrisScores.length > 0) {
                console.log('   First entry structure:', {
                    _id: tetrisScores[0]._id ? '✅' : '❌',
                    playerId: tetrisScores[0].playerId ? '✅' : '❌',
                    score: tetrisScores[0].score ? '✅' : '❌',
                    level: tetrisScores[0].level ? '✅' : '❌',
                    duration: tetrisScores[0].duration !== undefined ? '✅' : '❌'
                });
            }
        }
        
        console.log('\n🎉 Unified Highscore System Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Nur ausführen, wenn direkt aufgerufen
if (require.main === module) {
    testUnifiedHighscores();
}

module.exports = testUnifiedHighscores; 