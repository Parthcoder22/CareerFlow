// ============================================
// Migration: Add CGPA & Company Cutoff Fields
// ============================================
const { pool } = require('../../config/db');

const runMigration = async () => {
  try {
    console.log('🔄 Running CGPA & Eligibility Migration...');

    // 1. Add cgpa to students table if not exists
    await pool.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3, 2) DEFAULT NULL;
    `);
    console.log('✅ Updated students table with cgpa column.');

    // 2. Add min_cgpa, package, roles, eligibility_criteria to companies table
    await pool.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS min_cgpa NUMERIC(3, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS package VARCHAR(100),
      ADD COLUMN IF NOT EXISTS roles TEXT,
      ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT;
    `);
    console.log('✅ Updated companies table with min_cgpa, package, roles, and eligibility_criteria columns.');

    // 3. Seed/Update sample company CGPA cutoffs and packages
    const sampleUpdates = [
      { name: 'Google', min_cgpa: 8.50, package: '32.0 LPA', roles: 'Software Engineer, Site Reliability Engineer', criteria: 'Minimum 8.5 CGPA with no active backlogs. Strong proficiency in Data Structures & Algorithms.' },
      { name: 'Microsoft', min_cgpa: 8.00, package: '28.5 LPA', roles: 'Software Development Engineer, Cloud Engineer', criteria: 'Minimum 8.0 CGPA. CS/IT/ECE branches eligible.' },
      { name: 'Amazon', min_cgpa: 7.50, package: '25.0 LPA', roles: 'SDE-1, Quality Assurance Engineer', criteria: 'Minimum 7.5 CGPA required. Open to all engineering branches.' },
      { name: 'Goldman Sachs', min_cgpa: 8.00, package: '24.0 LPA', roles: 'Financial Analyst, Technology Analyst', criteria: 'Minimum 8.0 CGPA. Analytical & quantitative skills assessment.' },
      { name: 'Adobe', min_cgpa: 7.80, package: '22.5 LPA', roles: 'Member of Technical Staff, UI/UX Engineer', criteria: 'Minimum 7.8 CGPA. Experience with modern Web/C++ development.' },
      { name: 'Deloitte', min_cgpa: 6.50, package: '9.0 LPA', roles: 'Analyst, Tech Consultant', criteria: 'Minimum 6.5 CGPA. Open for B.Tech all branches.' },
      { name: 'TCS', min_cgpa: 6.00, package: '7.0 LPA', roles: 'Systems Engineer, Ninja Developer', criteria: 'Minimum 6.0 CGPA or 60% aggregate across 10th, 12th & B.Tech.' }
    ];

    for (const company of sampleUpdates) {
      // Check if company exists
      const existing = await pool.query(
        'SELECT id FROM companies WHERE LOWER(name) = LOWER($1)',
        [company.name]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO companies (name, min_cgpa, package, roles, eligibility_criteria, is_admin_verified)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [company.name, company.min_cgpa, company.package, company.roles, company.criteria]
        );
      } else {
        await pool.query(
          `UPDATE companies 
           SET min_cgpa = $2,
               package = COALESCE($3, package),
               roles = COALESCE($4, roles),
               eligibility_criteria = COALESCE($5, eligibility_criteria)
           WHERE id = $1`,
          [existing.rows[0].id, company.min_cgpa, company.package, company.roles, company.criteria]
        );
      }
    }

    console.log('✅ Seeded default company CGPA cutoffs and packages.');
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message || error);
  } finally {
    await pool.end();
  }
};

runMigration();
