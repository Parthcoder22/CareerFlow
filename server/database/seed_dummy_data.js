// ============================================
// seed_dummy_data.js - TNP Admin & Student Seed
// ============================================
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting TNP Admin & Student Seeding...');
    await client.query('BEGIN');

    // 1. Password Hashes
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);

    // 2. Upsert Admin User
    const adminEmail = 'admin@careerflow.com';
    let adminUser = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    let adminUserId;

    if (adminUser.rows.length === 0) {
      const res = await client.query(
        `INSERT INTO users (email, password, full_name, role, is_verified)
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [adminEmail, adminPasswordHash, 'Prof. Rajesh Sharma (Head TNP)', 'admin']
      );
      adminUserId = res.rows[0].id;
    } else {
      adminUserId = adminUser.rows[0].id;
      await client.query(
        `UPDATE users SET password = $1, full_name = $2, role = 'admin', is_verified = true WHERE id = $3`,
        [adminPasswordHash, 'Prof. Rajesh Sharma (Head TNP)', adminUserId]
      );
    }

    await client.query(
      `INSERT INTO admins (user_id, department, designation)
       VALUES ($1, 'Training & Placement Cell', 'Head of Placements')
       ON CONFLICT (user_id) DO UPDATE SET department = EXCLUDED.department, designation = EXCLUDED.designation`,
      [adminUserId]
    );
    console.log('✅ Admin user ready: admin@careerflow.com / Admin@123');

    // 3. Upsert Primary Student: student@careerflow.com
    const primaryStudentEmail = 'student@careerflow.com';
    let pStudent = await client.query('SELECT id FROM users WHERE email = $1', [primaryStudentEmail]);
    let pStudentUserId;

    if (pStudent.rows.length === 0) {
      const res = await client.query(
        `INSERT INTO users (email, password, full_name, role, is_verified)
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [primaryStudentEmail, studentPasswordHash, 'Parth Gohel', 'student']
      );
      pStudentUserId = res.rows[0].id;
    } else {
      pStudentUserId = pStudent.rows[0].id;
      await client.query(
        `UPDATE users SET password = $1, full_name = $2, role = 'student', is_verified = true WHERE id = $3`,
        [studentPasswordHash, 'Parth Gohel', pStudentUserId]
      );
    }

    // Upsert primary student record
    let pStudentRecord = await client.query('SELECT id FROM students WHERE user_id = $1', [pStudentUserId]);
    let pStudentId;
    if (pStudentRecord.rows.length === 0) {
      const res = await client.query(
        `INSERT INTO students (
           user_id, college, branch, graduation_year, cgpa, phone,
           placement_permission, is_placed, bio, skills, github_url, linkedin_url
         ) VALUES ($1, $2, $3, $4, $5, $6, true, false, $7, $8, $9, $10)
         RETURNING id`,
        [
          pStudentUserId,
          'Government Engineering College',
          'Computer Engineering',
          2026,
          8.75,
          '+91 98765 43210',
          'Pre-final year student passionate about Full Stack Web Systems, Microservices, and Cloud Native Architectures.',
          ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Python', 'Docker', 'DSA'],
          'https://github.com/parthcoder22',
          'https://linkedin.com/in/parthgohel'
        ]
      );
      pStudentId = res.rows[0].id;
    } else {
      pStudentId = pStudentRecord.rows[0].id;
      await client.query(
        `UPDATE students SET
           college = 'Government Engineering College',
           branch = 'Computer Engineering',
           graduation_year = 2026,
           cgpa = 8.75,
           phone = '+91 98765 43210',
           placement_permission = true,
           restriction_reason = NULL,
           is_placed = false,
           skills = ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Python', 'Docker', 'DSA']
         WHERE id = $1`,
        [pStudentId]
      );
    }
    console.log('✅ Primary Student ready: student@careerflow.com / Student@123');

    // 4. Dummy Resumes for Primary Student
    const existingResumes = await client.query('SELECT id FROM resumes WHERE student_id = $1', [pStudentId]);
    let resumeGoogleId, resumeSdeId;
    if (existingResumes.rows.length === 0) {
      const r1 = await client.query(
        `INSERT INTO resumes (student_id, name, target_company, file_url, file_size)
         VALUES ($1, 'Parth_Google_SDE_v2.pdf', 'Google', '/uploads/resumes/sample-resume-google.pdf', 245760)
         RETURNING id`,
        [pStudentId]
      );
      resumeGoogleId = r1.rows[0].id;

      const r2 = await client.query(
        `INSERT INTO resumes (student_id, name, target_company, file_url, file_size)
         VALUES ($1, 'Parth_FullStack_Core.pdf', 'General SDE', '/uploads/resumes/sample-resume-core.pdf', 218500)
         RETURNING id`,
        [pStudentId]
      );
      resumeSdeId = r2.rows[0].id;
      console.log('✅ Created 2 targeted resumes for primary student.');
    } else {
      resumeGoogleId = existingResumes.rows[0].id;
      resumeSdeId = existingResumes.rows[1]?.id || existingResumes.rows[0].id;
    }

    // 5. Fetch companies for creating dummy applications
    const compRows = await client.query('SELECT id, name, package, min_cgpa FROM companies');
    const compMap = {};
    compRows.rows.forEach(c => { compMap[c.name] = c; });

    // Link applications for primary student
    if (compMap['Google']) {
      await client.query(
        `INSERT INTO applications (student_id, company_id, company_name, role, package, status, resume_id)
         VALUES ($1, $2, 'Google', 'Software Development Engineer', '32.0 LPA', 'applied', $3)
         ON CONFLICT DO NOTHING`,
        [pStudentId, compMap['Google'].id, resumeGoogleId]
      );
    }
    if (compMap['Microsoft']) {
      await client.query(
        `INSERT INTO applications (student_id, company_id, company_name, role, package, status, resume_id)
         VALUES ($1, $2, 'Microsoft', 'Software Engineer (SWE)', '28.5 LPA', 'shortlisted', $3)
         ON CONFLICT DO NOTHING`,
        [pStudentId, compMap['Microsoft'].id, resumeSdeId]
      );
    }
    if (compMap['Amazon']) {
      await client.query(
        `INSERT INTO applications (student_id, company_id, company_name, role, package, status, resume_id)
         VALUES ($1, $2, 'Amazon', 'SDE Cloud Intern', '25.0 LPA', 'applied', $3)
         ON CONFLICT DO NOTHING`,
        [pStudentId, compMap['Amazon'].id, resumeSdeId]
      );
    }

    // 6. Create Additional Diverse Students
    const additionalStudents = [
      {
        email: 'rohit.sharma@college.edu',
        name: 'Rohit Sharma',
        branch: 'Information Technology',
        cgpa: 9.20,
        permission: true,
        reason: null,
        isPlaced: true,
        placedCompany: 'Google',
        placedPackage: '32.0 LPA',
        applyCompany: 'Google',
        applyStatus: 'selected',
        role: 'Software Development Engineer',
        pack: '32.0 LPA'
      },
      {
        email: 'priya.patel@college.edu',
        name: 'Priya Patel',
        branch: 'Computer Engineering',
        cgpa: 8.45,
        permission: true,
        reason: null,
        isPlaced: false,
        placedCompany: null,
        placedPackage: null,
        applyCompany: 'Goldman Sachs',
        applyStatus: 'shortlisted',
        role: 'Quantitative Software Analyst',
        pack: '24.0 LPA'
      },
      {
        email: 'arjun.verma@college.edu',
        name: 'Arjun Verma',
        branch: 'Electronics & Communication',
        cgpa: 7.65,
        permission: false,
        reason: 'Disciplinary hold pending clearance from Head of Department',
        isPlaced: false,
        placedCompany: null,
        placedPackage: null,
        applyCompany: 'Deloitte',
        applyStatus: 'rejected',
        role: 'Technology Analyst',
        pack: '9.0 LPA'
      },
      {
        email: 'ananya.deshmukh@college.edu',
        name: 'Ananya Deshmukh',
        branch: 'Mechanical Engineering',
        cgpa: 7.10,
        permission: true,
        reason: null,
        isPlaced: true,
        placedCompany: 'TCS',
        placedPackage: '7.0 LPA',
        applyCompany: 'TCS',
        applyStatus: 'selected',
        role: 'Systems Engineer',
        pack: '7.0 LPA'
      },
      {
        email: 'karan.mehta@college.edu',
        name: 'Karan Mehta',
        branch: 'Computer Engineering',
        cgpa: 8.10,
        permission: true,
        reason: null,
        isPlaced: false,
        placedCompany: null,
        placedPackage: null,
        applyCompany: 'Adobe',
        applyStatus: 'applied',
        role: 'Product Engineer',
        pack: '22.5 LPA'
      }
    ];

    for (const s of additionalStudents) {
      let uRes = await client.query('SELECT id FROM users WHERE email = $1', [s.email]);
      let uId;
      if (uRes.rows.length === 0) {
        const u = await client.query(
          `INSERT INTO users (email, password, full_name, role, is_verified)
           VALUES ($1, $2, $3, 'student', true) RETURNING id`,
          [s.email, studentPasswordHash, s.name]
        );
        uId = u.rows[0].id;
      } else {
        uId = uRes.rows[0].id;
        await client.query(`UPDATE users SET password = $1, full_name = $2 WHERE id = $3`, [studentPasswordHash, s.name, uId]);
      }

      let stRes = await client.query('SELECT id FROM students WHERE user_id = $1', [uId]);
      let stId;
      if (stRes.rows.length === 0) {
        const st = await client.query(
          `INSERT INTO students (
             user_id, college, branch, graduation_year, cgpa, phone,
             placement_permission, restriction_reason, is_placed, placed_company, placed_package,
             skills
           ) VALUES ($1, $2, $3, 2026, $4, '+91 91234 56789', $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            uId, 'Government Engineering College', s.branch, s.cgpa,
            s.permission, s.reason, s.isPlaced, s.placedCompany, s.placedPackage,
            ['Java', 'Python', 'SQL', 'Data Structures']
          ]
        );
        stId = st.rows[0].id;
      } else {
        stId = stRes.rows[0].id;
        await client.query(
          `UPDATE students SET
             college = 'Government Engineering College',
             branch = $1, cgpa = $2, placement_permission = $3,
             restriction_reason = $4, is_placed = $5, placed_company = $6, placed_package = $7
           WHERE id = $8`,
          [s.branch, s.cgpa, s.permission, s.reason, s.isPlaced, s.placedCompany, s.placedPackage, stId]
        );
      }

      // Add application if company exists
      if (s.applyCompany && compMap[s.applyCompany]) {
        const existingApp = await client.query(
          'SELECT id FROM applications WHERE student_id = $1 AND company_name = $2',
          [stId, s.applyCompany]
        );
        if (existingApp.rows.length === 0) {
          await client.query(
            `INSERT INTO applications (student_id, company_id, company_name, role, package, status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [stId, compMap[s.applyCompany].id, s.applyCompany, s.role, s.pack, s.applyStatus]
          );
        } else {
          await client.query(
            `UPDATE applications SET status = $1 WHERE id = $2`,
            [s.applyStatus, existingApp.rows[0].id]
          );
        }
      }
    }
    console.log('✅ Created 5 diverse student profiles with placed/unplaced and allowed/restricted states.');

    // 7. Seed Senior Experiences
    const expCount = await client.query('SELECT count(*) FROM experiences');
    if (parseInt(expCount.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO experiences (
           user_id, company_name, role, difficulty, overall_experience,
           rounds, questions, preparation_tips, verdict, is_anonymous
         ) VALUES
         (
           $1, 'Google', 'Software Development Engineer', 'Hard',
           'The drive consisted of an initial screening OA followed by 3 rounds of DSA and 1 Googliness round. Very focused on clean modular code, edge-case coverage, and complexity trade-offs.',
           'Round 1: Online Coding (2 Medium-Hard LeetCode problems)\nRound 2: Graph Theory & Shortest Path (Dijkstra variation)\nRound 3: Dynamic Programming on Trees\nRound 4: Behavioral & Googliness',
           'Q1: Given an undirected weighted graph, find the minimum path under time window constraints.\nQ2: Design an LRU Cache with TTL expiry support.\nQ3: Tell me about a time you handled disagreement in an engineering team.',
           'Master Graphs, Trees, and DP. Speak your thoughts out loud during coding. Never write code until you clarify all edge cases with the interviewer.',
           'selected', false
         ),
         (
           $1, 'Microsoft', 'Software Engineer (SWE)', 'Medium',
           'Very friendly interviewers. Asked practical questions on System Architecture, OOP design patterns, and balanced binary search trees.',
           'Round 1: Codility Assessment\nRound 2: DSA & Object-Oriented Design\nRound 3: System Design & Tech Lead Discussion',
           'Q1: Reverse nodes in k-group in a Linked List.\nQ2: Design a Rate Limiter for an API gateway.\nQ3: Explain how PostgreSQL handles concurrency with MVCC.',
           'Practice standard Striver SDE sheet and review OS concepts (paging, deadlocks, virtual memory).',
           'selected', true
         )`,
        [pStudentUserId]
      );
      console.log('✅ Seeded real placement experiences.');
    }

    await client.query('COMMIT');
    console.log('\n🎉 ALL DUMMY TNP DATA SEEDED SUCCESSFULLY!');
    console.log('───────────────────────────────────────────────────────');
    console.log('👑 ADMIN (TNP OFFICER):');
    console.log('   Email:    admin@careerflow.com');
    console.log('   Password: Admin@123');
    console.log('');
    console.log('🎓 STUDENT (PLACEMENT SEEKER):');
    console.log('   Email:    student@careerflow.com');
    console.log('   Password: Student@123');
    console.log('───────────────────────────────────────────────────────');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
