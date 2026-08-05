// ============================================
// Reminder Service (Cron Jobs)
// ============================================
// Design Decision: node-cron is used to schedule recurring tasks.
// Runs daily at 8:00 AM to check for:
// 1. OAs happening tomorrow
// 2. Interviews happening tomorrow
// 3. Application deadlines today
// 4. Students with no resume uploaded
//
// Each check creates an in-app notification and sends an email.

const cron = require('node-cron');
const db = require('../config/db');
const { sendReminderEmail } = require('./emailService');

/**
 * Start the reminder cron job.
 * Runs every day at 8:00 AM server time.
 */
const startReminderCron = () => {
  // Schedule: minute hour day-of-month month day-of-week
  // '0 8 * * *' = At 08:00 every day
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily reminder check...');
    try {
      await checkOAReminders();
      await checkInterviewReminders();
      await checkDeadlineReminders();
      console.log('✅ Reminder check completed');
    } catch (error) {
      console.error('❌ Reminder check failed:', error.message);
    }
  });

  console.log('📅 Reminder cron job scheduled (daily at 8:00 AM)');
};

/**
 * Check for OAs happening tomorrow and send reminders.
 */
const checkOAReminders = async () => {
  const { rows } = await db.query(`
    SELECT a.company_name, a.role, a.oa_date, a.application_link,
           u.email, u.full_name, u.id as user_id
    FROM applications a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.oa_date::date = CURRENT_DATE + INTERVAL '1 day'
      AND a.status NOT IN ('rejected', 'withdrawn', 'offer')
  `);

  for (const row of rows) {
    // Create in-app notification
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'oa_reminder', $2, $3, '/applications')`,
      [
        row.user_id,
        `OA Tomorrow: ${row.company_name}`,
        `Your Online Assessment for ${row.company_name} (${row.role}) is tomorrow at ${new Date(row.oa_date).toLocaleString()}.`
      ]
    );

    // Send email
    try {
      await sendReminderEmail(row.email, row.full_name, 'oa_reminder', {
        company: row.company_name,
        role: row.role,
        date: new Date(row.oa_date).toLocaleString(),
        link: row.application_link,
      });
    } catch (err) {
      console.warn(`Failed to send OA reminder email to ${row.email}:`, err.message);
    }
  }

  if (rows.length > 0) {
    console.log(`  📝 Sent ${rows.length} OA reminder(s)`);
  }
};

/**
 * Check for interviews happening tomorrow and send reminders.
 */
const checkInterviewReminders = async () => {
  const { rows } = await db.query(`
    SELECT a.company_name, a.role, a.interview_date, a.application_link,
           u.email, u.full_name, u.id as user_id
    FROM applications a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.interview_date::date = CURRENT_DATE + INTERVAL '1 day'
      AND a.status NOT IN ('rejected', 'withdrawn', 'offer')
  `);

  for (const row of rows) {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'interview_reminder', $2, $3, '/applications')`,
      [
        row.user_id,
        `Interview Tomorrow: ${row.company_name}`,
        `Your interview for ${row.company_name} (${row.role}) is tomorrow at ${new Date(row.interview_date).toLocaleString()}.`
      ]
    );

    try {
      await sendReminderEmail(row.email, row.full_name, 'interview_reminder', {
        company: row.company_name,
        role: row.role,
        date: new Date(row.interview_date).toLocaleString(),
        link: row.application_link,
      });
    } catch (err) {
      console.warn(`Failed to send interview reminder email to ${row.email}:`, err.message);
    }
  }

  if (rows.length > 0) {
    console.log(`  🎤 Sent ${rows.length} interview reminder(s)`);
  }
};

/**
 * Check for application deadlines today and send reminders.
 */
const checkDeadlineReminders = async () => {
  const { rows } = await db.query(`
    SELECT a.company_name, a.role, a.deadline, a.application_link,
           u.email, u.full_name, u.id as user_id
    FROM applications a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.deadline::date = CURRENT_DATE
      AND a.status = 'applied'
  `);

  for (const row of rows) {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'deadline_reminder', $2, $3, '/applications')`,
      [
        row.user_id,
        `Deadline Today: ${row.company_name}`,
        `Application deadline for ${row.company_name} (${row.role}) is today!`
      ]
    );

    try {
      await sendReminderEmail(row.email, row.full_name, 'deadline_reminder', {
        company: row.company_name,
        role: row.role,
        date: new Date(row.deadline).toLocaleString(),
        link: row.application_link,
      });
    } catch (err) {
      console.warn(`Failed to send deadline reminder email to ${row.email}:`, err.message);
    }
  }

  if (rows.length > 0) {
    console.log(`  ⏰ Sent ${rows.length} deadline reminder(s)`);
  }
};

module.exports = { startReminderCron };
