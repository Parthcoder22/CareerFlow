// ============================================
// Cloudinary Configuration
// ============================================
// Design Decision: Cloudinary is used instead of storing files in PostgreSQL
// because:
// 1. BLOB storage in PostgreSQL is inefficient and bloats the database
// 2. Cloudinary provides a CDN (Content Delivery Network) for fast access
// 3. Automatic image/PDF optimization
// 4. Easy file management (upload, delete, transform)
// 5. Free tier: 25 credits/month (sufficient for student projects)

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
