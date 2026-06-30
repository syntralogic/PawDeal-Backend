const DB = require('./models/db');

async function testDatabase() {
    console.log('🔍 Testing Database Connection...');
    console.log('----------------------------------------');
    
    try {
        // Test 1: Get user count
        const users = await DB.query('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Users: ${users[0].count}`);
        
        // Test 2: Get pet count
        const pets = await DB.query('SELECT COUNT(*) as count FROM pets');
        console.log(`✅ Pets: ${pets[0].count}`);
        
        // Test 3: Get product count
        const products = await DB.query('SELECT COUNT(*) as count FROM products');
        console.log(`✅ Products: ${products[0].count}`);
        
        // Test 4: Get message count
        const messages = await DB.query('SELECT COUNT(*) as count FROM messages');
        console.log(`✅ Messages: ${messages[0].count}`);
        
        // Test 5: Get breed count
        const breeds = await DB.query('SELECT COUNT(*) as count FROM breeds');
        console.log(`✅ Breeds: ${breeds[0].count}`);
        
        // Test 6: Check if a specific user exists
        const userExists = await DB.exists('SELECT * FROM users WHERE email = ?', ['aroojashfaq979@gmail.com']);
        console.log(`✅ User 'aroojashfaq979@gmail.com' exists: ${userExists}`);
        
        // Test 7: Get a single user
        const user = await DB.getOne('SELECT id, email, first_name, last_name FROM users WHERE email = ?', ['aroojashfaq979@gmail.com']);
        if (user) {
            console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);
        }
        
        // Test 8: Get recent users
        const recentUsers = await DB.query('SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('\n📋 Recent Users:');
        console.log('----------------------------------------');
        recentUsers.forEach(user => {
            console.log(`   ${user.first_name} ${user.last_name} - ${user.email} (${user.created_at})`);
        });
        
        // Test 9: Get available pets
        const availablePets = await DB.query('SELECT id, name, category, price, status FROM pets WHERE status = "available" LIMIT 5');
        console.log('\n🐾 Available Pets:');
        console.log('----------------------------------------');
        availablePets.forEach(pet => {
            console.log(`   ${pet.name} (${pet.category}) - $${pet.price} - ${pet.status}`);
        });
        
        // Test 10: Get recent messages
        const recentMessages = await DB.query('SELECT id, message_content, created_at FROM messages ORDER BY created_at DESC LIMIT 5');
        console.log('\n💬 Recent Messages:');
        console.log('----------------------------------------');
        recentMessages.forEach(msg => {
            console.log(`   ${msg.message_content.substring(0, 30)}... (${msg.created_at})`);
        });
        
        console.log('\n✅ All tests passed!');
        console.log('🎉 Your database is working correctly!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('   Make sure your tables exist in the database.');
            console.error('   Run your SQL import file first.');
        }
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Check your username and password in .env');
        }
        if (error.code === 'ENOTFOUND') {
            console.error('   Check your DB_HOST. Make sure it\'s correct from Aiven');
        }
        if (error.code === 'ECONNREFUSED') {
            console.error('   Connection refused. Check your DB_HOST and DB_PORT');
        }
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('   Connection lost. Check your network and database server');
        }
        console.error('\n💡 Full error details:', error);
    }
}

// Run the test
testDatabase();