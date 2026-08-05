// ============================================
// Email Service
// ============================================
// Handles all email sending logic using Nodemailer.
// Templates are defined here for consistent branding.

const transporter = require('../config/email');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.EMAIL_USER || 'noreply@careerflow.com';

/**
 * Send email verification link after signup.
 */
const sendVerificationEmail = async (email, fullName, token) => {
  const verificationUrl = `${CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"CareerFlow" <${FROM_EMAIL}>`,
    to: email,
    subject: '🚀 Verify your CareerFlow account',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <h1 style="color: #818cf8; margin-bottom: 8px;">Welcome to CareerFlow!</h1>
        <p>Hi ${fullName},</p>
        <p>Thank you for signing up. Please verify your email address to get started.</p>
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
          Verify Email Address
        </a>
        <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy this link:<br/>
        <a href="${verificationUrl}" style="color: #818cf8;">${verificationUrl}</a></p>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send password reset link.
 */
const sendPasswordResetEmail = async (email, fullName, token) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"CareerFlow" <${FROM_EMAIL}>`,
    to: email,
    subject: '🔐 Reset your CareerFlow password',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <h1 style="color: #818cf8;">Password Reset</h1>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your password. Click the button below:</p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy this link:<br/>
        <a href="${resetUrl}" style="color: #818cf8;">${resetUrl}</a></p>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send reminder email (OA, Interview, Deadline).
 */
const sendReminderEmail = async (email, fullName, type, details) => {
  const typeLabels = {
    oa_reminder: '📝 OA Reminder',
    interview_reminder: '🎤 Interview Reminder',
    deadline_reminder: '⏰ Deadline Reminder',
  };

  const mailOptions = {
    from: `"CareerFlow" <${FROM_EMAIL}>`,
    to: email,
    subject: `${typeLabels[type] || '🔔 Reminder'} – ${details.company}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <h1 style="color: #818cf8;">${typeLabels[type] || 'Reminder'}</h1>
        <p>Hi ${fullName},</p>
        <p>This is a reminder for your upcoming event:</p>
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Company:</strong> ${details.company}</p>
          <p><strong>Role:</strong> ${details.role || 'N/A'}</p>
          <p><strong>Date:</strong> ${details.date}</p>
          ${details.link ? `<p><strong>Link:</strong> <a href="${details.link}" style="color: #818cf8;">${details.link}</a></p>` : ''}
        </div>
        <a href="${CLIENT_URL}/applications" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
          View in CareerFlow
        </a>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">Good luck! 🍀 - CareerFlow Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendReminderEmail,
};
