// ============================================
// Database Seeding Script
// ============================================
// Run this script to execute the seed.sql data into your PostgreSQL database.
// Usage: npm run db:seed

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const seedDB = async () => {
  try {
    const seedPath = path.join(__dirname, 'seed.sql');
    
    if (!fs.existsSync(seedPath)) {
      console.log('⚠️ No seed.sql file found.');
      return;
    }

    const seedData = fs.readFileSync(seedPath, 'utf-8');

    console.log('🌱 Seeding database...');
    await pool.query(seedData);
    console.log('✅ Seed data loaded successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
  } finally {
     await pool.end();
  }
};

seedDB();
