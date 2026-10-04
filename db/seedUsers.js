// db/seedUsers.js
require('dotenv').config();
const mongoose = require('mongoose');
const { seedInitialUsers } = require('../controllers/userCtrl');

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log('Running user seeding...');
    await seedInitialUsers();

    console.log('Closing connection...');
    await mongoose.disconnect();
    console.log('🎉 Done seeding users!');
}

run().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
