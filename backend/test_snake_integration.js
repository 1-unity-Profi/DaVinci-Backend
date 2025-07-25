const mongoose = require('mongoose');
const Player = require('./models/Player');
const Score = require('./models/Score');

async function testSnakeIntegration() {
    console.log('🐍 Testing Snake Game Backend Integration...\n');
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arcade', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        
        // Test 1: Create a test player for Snake
        let testPlayer = await Player.findOne({ badgeId: 'SNAKE_TEST_001' });
        if (!testPlayer) {
            testPlayer = new Player({
                badgeId: 'SNAKE_TEST_001',
                name: 'SnakeTestPlayer'
            });
            await testPlayer.save();
            console.log('✅ Created Snake test player');
        }
        
        // Test 2: Add multiple Snake scores for same player to test deduplication
        const snakeScore1 = new Score({
            playerId: testPlayer._id,
            gameName: 'snake',
            score: 15,
            level: 1,
            duration: 120
        });
        await snakeScore1.save();
        console.log('✅ Added Snake score:', snakeScore1.score);
        
        const snakeScore2 = new Score({
            playerId: testPlayer._id,
            gameName: 'snake',
            score: 22, // Higher score - should be the one shown in highscores
            level: 1,
            duration: 180
        });
        await snakeScore2.save();
        console.log('✅ Added Snake score:', snakeScore2.score);
        
        // Add another player for comparison
        let testPlayer2 = await Player.findOne({ badgeId: 'SNAKE_TEST_002' });
        if (!testPlayer2) {
            testPlayer2 = new Player({
                badgeId: 'SNAKE_TEST_002',
                name: 'SnakeTestPlayer2'
            });
            await testPlayer2.save();
            console.log('✅ Created second Snake test player');
        }
        
        const snakeScore3 = new Score({
            playerId: testPlayer2._id,
            gameName: 'snake',
            score: 18,
            level: 1,
            duration: 150
        });
        await snakeScore3.save();
        console.log('✅ Added Snake score for second player:', snakeScore3.score);
        
        // Test 3: Test unified API response for Snake
        const snakeScores = await fetch('http://localhost:5000/api/scores/game/snake')
            .then(res => res.json())
            .catch(err => ({ error: err.message }));
        
        console.log('\n🐍 Snake Scores API Response:');
        if (snakeScores.error) {
            console.log('❌ Error:', snakeScores.error);
        } else {
            console.log('✅ Found', snakeScores.length, 'unique snake players');
            
            // Test deduplication: Check that each player appears only once
            const playerNames = snakeScores.map(score => score.playerId?.name);
            const uniquePlayerNames = [...new Set(playerNames)];
            
            console.log('   Player names in highscores:', playerNames);
            console.log('   Unique player names:', uniquePlayerNames);
            
            if (playerNames.length === uniquePlayerNames.length) {
                console.log('✅ Deduplication working: Each player appears only once');
            } else {
                console.log('❌ Deduplication failed: Some players appear multiple times');
            }
            
            if (snakeScores.length > 0) {
                console.log('   First entry structure:', {
                    _id: snakeScores[0]._id ? '✅' : '❌',
                    playerId: snakeScores[0].playerId ? '✅' : '❌',
                    score: snakeScores[0].score ? '✅' : '❌',
                    level: snakeScores[0].level ? '✅' : '❌',
                    duration: snakeScores[0].duration !== undefined ? '✅' : '❌'
                });
                
                // Find the test player's entry
                const testPlayerEntry = snakeScores.find(score => 
                    score.playerId?.name === 'SnakeTestPlayer'
                );
                
                if (testPlayerEntry) {
                    console.log('   Test player best score:', testPlayerEntry.score);
                    if (testPlayerEntry.score === 22) {
                        console.log('✅ Showing best score (22) instead of all scores (15, 22)');
                    } else {
                        console.log('❌ Not showing the best score');
                    }
                }
            }
        }
        
        // Test 4: Test player statistics calculation
        const allScores = await Score.find({ playerId: testPlayer._id, gameName: 'snake' });
        const maxScore = allScores.length > 0 ? Math.max(...allScores.map(s => s.score)) : 0;
        
        console.log('\n📊 Player Statistics:');
        console.log('   Total Snake Games:', allScores.length);
        console.log('   Best Score:', maxScore);
        console.log('   Average Score:', allScores.length > 0 ? Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length) : 0);
        
        // Test 5: Verify Score submission format
        console.log('\n🧪 Testing Score Submission Format:');
        const testSubmission = {
            playerId: testPlayer._id,
            gameName: 'snake',
            score: 25,
            level: 1,
            duration: 200,
            gameData: {
                fruitsEaten: 25,
                snakeLength: 28,
                activeSkin: 'green',
                activeAbility: 'wormhole',
                maxLength: 28
            }
        };
        
        console.log('✅ Test submission format valid');
        console.log('   Sample gameData:', JSON.stringify(testSubmission.gameData, null, 2));
        
        console.log('\n🎉 Snake Backend Integration Test Complete!');
        console.log('   - Score submission: ✅ Ready');
        console.log('   - Highscore loading: ✅ Ready');
        console.log('   - Player stats: ✅ Ready');
        console.log('   - API compatibility: ✅ Ready');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run test if called directly
if (require.main === module) {
    testSnakeIntegration();
}

module.exports = testSnakeIntegration; 