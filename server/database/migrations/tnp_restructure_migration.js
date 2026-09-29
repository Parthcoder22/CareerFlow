// ============================================
// Migration: TNP College Placement System Restructure
// ============================================
const { pool } = require('../../config/db');

const runMigration = async () => {
  try {
    console.log('🔄 Running TNP Restructure Migration...');

    // 1. Update students table
    await pool.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS placement_permission BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS restriction_reason TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS is_placed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS placed_company VARCHAR(200) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS placed_package VARCHAR(100) DEFAULT NULL;
    `);
    console.log('✅ Updated students table (placement_permission, is_placed, placed_company, etc.).');

    // 2. Update companies table
    await pool.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS location VARCHAR(200) DEFAULT 'On-Campus / Bangalore',
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS drive_date TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
    `);
    console.log('✅ Updated companies table (location, deadline, drive_date, status).');

    // 3. Update applications table status to VARCHAR(50) to allow simple status flow:
    // Applied -> Shortlisted -> Selected -> Rejected
    try {
      await pool.query(`
        ALTER TABLE applications 
        ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
      `);
      // Update default
      await pool.query(`
        ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'applied';
      `);
      // Normalize 'offer' -> 'selected'
      await pool.query(`
        UPDATE applications SET status = 'selected' WHERE status = 'offer';
      `);
      console.log('✅ Updated applications status column to VARCHAR(50).');
    } catch (err) {
      console.warn('Status type alter warning:', err.message);
    }

    // 4. Add company_id foreign key to applications
    await pool.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    `);

    // Backfill company_id from company_name where missing
    await pool.query(`
      UPDATE applications a
      SET company_id = c.id
      FROM companies c
      WHERE a.company_id IS NULL AND LOWER(c.name) = LOWER(a.company_name);
    `);
    console.log('✅ Linked applications to companies table via company_id.');

    // 5. Update existing companies with realistic future deadlines & locations if empty
    await pool.query(`
      UPDATE companies 
      SET 
        deadline = COALESCE(deadline, CURRENT_DATE + INTERVAL '14 days'),
        drive_date = COALESCE(drive_date, CURRENT_DATE + INTERVAL '21 days'),
        location = COALESCE(location, 'Bangalore / Hybrid'),
        status = COALESCE(status, 'active')
      WHERE deadline IS NULL OR location IS NULL;
    `);

    // 6. Set sample students placement status based on applications
    await pool.query(`
      UPDATE students s
      SET 
        is_placed = true,
        placed_company = a.company_name,
        placed_package = COALESCE(a.package, '24.0 LPA')
      FROM applications a
      WHERE a.student_id = s.id AND a.status IN ('selected', 'offer');
    `);

    console.log('🎉 TNP Restructure Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message || error);
  } finally {
    await pool.end();
  }
};

runMigration();
