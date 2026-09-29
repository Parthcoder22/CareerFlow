// ============================================
// CareerFlow – Express Server Entry Point
// ============================================
// Design Decision: Single entry point that composes all middleware and routes.
// Express is chosen for its simplicity, large ecosystem, and excellent
// middleware support. We follow a layered architecture:
// server.js → routes → controllers → models → database

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { generalLimiter } = require('./middleware/rateLimiter');
const { startReminderCron } = require('./services/reminderService');

// Load environment variables before anything else
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Static uploads directory for general non-resume static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet: Sets various HTTP headers to prevent common attacks
// (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS: Allow requests from our React frontend only
// Design Decision: Whitelist only our frontend URL to prevent
// unauthorized cross-origin requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting: Prevent brute-force and DDoS attacks
// General limit: 1000 requests per 15 minutes per IP
app.use(generalLimiter);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Parse JSON request bodies (limit 10MB for JD text + resume metadata)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data (for form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// API ROUTES
// ============================================

// Health check endpoint - useful for deployment monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CareerFlow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount route modules
// Each route file handles a specific domain of the application
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/experiences', require('./routes/experienceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - for routes that don't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler - catches all unhandled errors
// Design Decision: Centralized error handling prevents crashes and
// provides consistent error responses to the frontend
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err.stack);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

// Process safety guards to prevent unhandled errors from terminating the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚀 CareerFlow Server Running          ║
  ║   📡 Port: ${PORT}                         ║
  ║   🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}║
  ║   📅 ${new Date().toISOString()}   ║
  ╚══════════════════════════════════════════╝
  `);

  // Start daily notification cron jobs
  try {
    startReminderCron();
  } catch (cronErr) {
    console.warn('Reminder cron scheduling warning:', cronErr.message);
  }
});

module.exports = app;
