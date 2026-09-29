// ============================================
// Migration: Cloudinary-Only Resumes Schema Update
// ============================================
const { pool } = require('../../config/db');

const runMigration = async () => {
  try {
    console.log('🔄 Running Cloudinary Resumes Migration...');

    // 1. Add cloudinary_public_id column
    await pool.query(`
      ALTER TABLE resumes 
      ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(500) DEFAULT NULL;
    `);

    // 2. Synchronize legacy cloudinary_id to cloudinary_public_id
    await pool.query(`
      UPDATE resumes 
      SET cloudinary_public_id = cloudinary_id 
      WHERE cloudinary_public_id IS NULL AND cloudinary_id IS NOT NULL;
    `);

    console.log('✅ Cloudinary Resumes Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
