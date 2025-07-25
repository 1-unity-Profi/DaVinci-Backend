const mongoose = require('mongoose');
const Player = require('./models/Player');
const Score = require('./models/Score');

async function testDeduplication() {
    console.log('🔍 Testing Snake Highscore Deduplication Fix...\n');
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arcade', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        
        // Create test players
        const players = [];
        for (let i = 1; i <= 3; i++) {
            let player = await Player.findOne({ badgeId: `DEDUP_TEST_${i}` });
            if (!player) {
                player = new Player({
                    badgeId: `DEDUP_TEST_${i}`,
                    name: `DedupPlayer${i}`
                });
                await player.save();
            }
            players.push(player);
        }
        console.log('✅ Created 3 test players');
        
        // Add multiple scores for each player
        const scores = [
            { player: players[0], score: 10 },
            { player: players[0], score: 25 }, // Best for player 1
            { player: players[0], score: 15 },
            { player: players[1], score: 30 }, // Best for player 2
            { player: players[1], score: 20 },
            { player: players[2], score: 12 }, // Best for player 3
        ];
        
        for (const scoreData of scores) {
            const score = new Score({
                playerId: scoreData.player._id,
                gameName: 'snake',
                score: scoreData.score,
                level: 1,
                duration: 100
            });
            await score.save();
        }
        console.log('✅ Added multiple scores per player');
        
        // Test the API endpoint
        const response = await fetch('http://localhost:5000/api/scores/game/snake')
            .then(res => res.json())
            .catch(err => ({ error: err.message }));
        
        console.log('\n📊 Deduplication Test Results:');
        if (response.error) {
            console.log('❌ API Error:', response.error);
            return;
        }
        
        const testPlayers = response.filter(entry => 
            entry.playerId?.name?.startsWith('DedupPlayer')
        );
        
        console.log('Test players in response:', testPlayers.length);
        
        // Check each test player appears only once with their best score
        const expected = [
            { name: 'DedupPlayer1', bestScore: 25 },
            { name: 'DedupPlayer2', bestScore: 30 },
            { name: 'DedupPlayer3', bestScore: 12 },
        ];
        
        let allCorrect = true;
        for (const expect of expected) {
            const found = testPlayers.filter(p => p.playerId.name === expect.name);
            
            if (found.length === 1) {
                console.log(`✅ ${expect.name}: appears once`);
                if (found[0].score === expect.bestScore) {
                    console.log(`✅ ${expect.name}: shows best score (${expect.bestScore})`);
                } else {
                    console.log(`❌ ${expect.name}: wrong score (${found[0].score} instead of ${expect.bestScore})`);
                    allCorrect = false;
                }
            } else {
                console.log(`❌ ${expect.name}: appears ${found.length} times (should be 1)`);
                allCorrect = false;
            }
        }
        
        if (allCorrect) {
            console.log('\n🎉 Deduplication test PASSED! Each player appears once with best score.');
        } else {
            console.log('\n❌ Deduplication test FAILED! Issues found above.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run test if called directly
if (require.main === module) {
    testDeduplication();
}

module.exports = testDeduplication; 