// ============================================
// Nodemailer Email Configuration
// ============================================
// Design Decision: Nodemailer with Gmail SMTP for email delivery.
// Gmail's App Password feature allows secure programmatic email sending
// without exposing your main password.
//
// For production, consider services like SendGrid, Mailgun, or AWS SES
// for higher volume and better deliverability.

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify()
  .then(() => console.log('📧 Email transporter ready'))
  .catch((err) => console.warn('⚠️  Email transporter not configured:', err.message));

module.exports = transporter;
