// ============================================
// AI Controller
// ============================================
// Handles Job Description analysis using Gemini API.

const { analyzeJobDescription } = require('../services/geminiService');

// ============================================
// POST /api/ai/analyze-jd
// ============================================
const analyzeJD = async (req, res) => {
  try {
    const { job_description } = req.body;

    const result = await analyzeJobDescription(job_description);

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: 'Job description analyzed successfully.',
      data: result.data,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'AI analysis failed. Please try again later.',
    });
  }
};

module.exports = { analyzeJD };
