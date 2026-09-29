// ============================================
// Cloudinary Service for Resumes
// ============================================
const cloudinary = require('../config/cloudinary');

/**
 * Uploads a resume PDF buffer directly to Cloudinary.
 * Stores under a student-isolated folder: careerflow/resumes/student_${studentId}/
 * 
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} studentId - Unique student identifier
 * @param {string} originalName - Original filename for display/metadata
 * @returns {Promise<{ secure_url: string, public_id: string, resource_type: string, bytes: number }>}
 */
const uploadResumeToCloudinary = (buffer, studentId, originalName = 'resume') => {
  return new Promise((resolve, reject) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(new Error('Invalid file buffer provided for Cloudinary upload.'));
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const publicId = `resume_${timestamp}_${randomSuffix}`;
    const folder = `careerflow/resumes/student_${studentId}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto', // Handles PDF documents
        format: 'pdf',
        tags: ['careerflow', 'resume', `student_${studentId}`],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary resume upload stream error:', error);
          return reject(error);
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type || 'raw',
          bytes: result.bytes || buffer.length,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Deletes a resume asset from Cloudinary.
 * 
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - Resource type (auto, raw, image)
 * @returns {Promise<any>}
 */
const deleteResumeFromCloudinary = async (publicId, resourceType = 'raw') => {
  if (!publicId) return null;
  try {
    // Attempt deletion with provided resource_type
    let res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    
    // If not found, try image/raw fallback
    if (res.result === 'not found') {
      const altType = resourceType === 'raw' ? 'image' : 'raw';
      res = await cloudinary.uploader.destroy(publicId, { resource_type: altType });
    }
    return res;
  } catch (err) {
    console.warn(`Cloudinary deletion warning for asset ${publicId}:`, err.message);
    return null;
  }
};

module.exports = {
  uploadResumeToCloudinary,
  deleteResumeFromCloudinary,
};
