// ============================================
// Database Initialization Script
// ============================================
// Run this script to create all tables in your PostgreSQL database.
// Usage: npm run db:init
//
// This reads schema.sql and executes it against your database.

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const initDB = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🔄 Initializing database...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');

    // Check if seed data should be loaded
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedData = fs.readFileSync(seedPath, 'utf-8');
      await pool.query(seedData);
      console.log('✅ Seed data loaded successfully!');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message || error);
  } finally {
    await pool.end();
  }
};

initDB();
