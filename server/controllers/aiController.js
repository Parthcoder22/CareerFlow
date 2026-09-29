// ============================================
// AI ATS Controller
// ============================================
const { analyzeResumeATS, analyzeJobDescription } = require('../services/geminiService');
const db = require('../config/db');

// ============================================
// POST /api/ai/analyze-resume
// ============================================
const analyzeResume = async (req, res) => {
  try {
    const { resume_id, resume_name, target_company, role, job_description, resume_text } = req.body;

    let resolvedJd = (job_description || '').trim();

    // If JD is empty or too short, look up company drive description in database
    if (resolvedJd.length < 20 && target_company) {
      const compRes = await db.query(
        'SELECT name, roles, package, description, job_description, eligibility_criteria FROM companies WHERE LOWER(name) = LOWER($1) OR name ILIKE $2 LIMIT 1',
        [target_company.trim(), `%${target_company.trim()}%`]
      );
      if (compRes.rows.length > 0) {
        const c = compRes.rows[0];
        resolvedJd = [
          c.job_description,
          c.description,
          c.roles ? `Target Role: ${c.roles}` : '',
          c.eligibility_criteria ? `Eligibility Criteria: ${c.eligibility_criteria}` : '',
          c.package ? `Package: ${c.package}` : '',
        ].filter(Boolean).join('\n\n');
      }
    }

    // If still empty or minimal, synthesize comprehensive campus drive JD
    if (resolvedJd.length < 20) {
      const cName = target_company?.trim() || 'Campus Placement Drive';
      const rName = role?.trim() || 'Software Development Engineer';
      resolvedJd = `Campus recruitment drive for ${cName} hiring for the position of ${rName}. Key responsibilities include designing scalable systems, building performant full-stack features, writing clean modular code, optimizing databases, and participating in agile development. Required qualifications: strong problem-solving abilities, proficiency in data structures and algorithms, object-oriented programming, modern frameworks, and cloud architectures.`;
    }

    let resolvedResumeName = resume_name;
    let resolvedText = resume_text || '';

    // If resume_id passed, fetch resume metadata
    if (resume_id) {
      const resumeRes = await db.query(
        'SELECT name, target_company FROM resumes WHERE id = $1',
        [resume_id]
      );
      if (resumeRes.rows.length > 0) {
        resolvedResumeName = resumeRes.rows[0].name;
        resolvedText = `${resumeRes.rows[0].name} ${resumeRes.rows[0].target_company || ''} ${resolvedText}`;
      }
    }

    const result = await analyzeResumeATS({
      resume_name: resolvedResumeName || 'Technical Resume',
      target_company: target_company || 'Campus Placement Drive',
      role: role || 'Software Development Engineer',
      job_description: resolvedJd,
      resume_text: resolvedText,
    });

    res.json({
      success: true,
      message: 'ATS Resume analysis completed successfully.',
      data: result.data,
    });
  } catch (error) {
    console.error('AI ATS resume analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete ATS resume analysis. Please try again.',
    });
  }
};

// ============================================
// POST /api/ai/analyze-jd (legacy support)
// ============================================
const analyzeJD = async (req, res) => {
  try {
    const { job_description } = req.body;
    const result = await analyzeJobDescription(job_description);
    res.json({
      success: true,
      message: 'Job description analyzed successfully.',
      data: result.data,
    });
  } catch (error) {
    console.error('AI JD analysis error:', error);
    res.status(500).json({ success: false, message: 'AI analysis failed.' });
  }
};

module.exports = { analyzeResume, analyzeJD };
