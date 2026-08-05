// ============================================
// Gemini AI Service
// ============================================
// Design Decision: Google Gemini API is used for AI-powered JD analysis.
// Why Gemini over ChatGPT?
// 1. Free tier with generous limits (60 requests/min)
// 2. Fast response times
// 3. Excellent at structured data extraction
// 4. Google's latest AI model
//
// The prompt is carefully engineered to return structured JSON
// that can be directly rendered by the frontend.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze a job description and return structured insights.
 * @param {string} jobDescription - The raw JD text
 * @returns {Object} Structured analysis results
 */
const analyzeJobDescription = async (jobDescription) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  // Carefully engineered prompt for consistent, structured output
  const prompt = `
You are an expert career advisor and technical recruiter. Analyze the following job description and provide a comprehensive breakdown.

IMPORTANT: Return your response as valid JSON only. No markdown, no code blocks, no extra text.

Job Description:
"""
${jobDescription}
"""

Return a JSON object with exactly these fields:

{
  "required_skills": [
    { "skill": "skill name", "level": "beginner|intermediate|advanced", "category": "language|framework|tool|soft_skill|domain" }
  ],
  "missing_skills_tips": [
    { "skill": "commonly missing skill", "importance": "critical|important|nice_to_have", "how_to_learn": "brief learning suggestion" }
  ],
  "resume_improvements": [
    { "section": "section of resume", "suggestion": "specific improvement", "priority": "high|medium|low" }
  ],
  "likely_interview_questions": [
    { "question": "the question", "category": "technical|behavioral|situational|system_design", "difficulty": "easy|medium|hard", "tip": "brief answer strategy" }
  ],
  "topics_to_study": [
    { "topic": "topic name", "depth": "overview|in_depth|expert", "resources": "suggested resource or approach" }
  ],
  "relevant_projects": [
    { "project_idea": "project name", "description": "brief description", "skills_demonstrated": ["skill1", "skill2"], "complexity": "beginner|intermediate|advanced" }
  ],
  "learning_roadmap": [
    { "week": "Week 1-2", "focus": "what to focus on", "tasks": ["task1", "task2"] }
  ],
  "job_summary": {
    "role": "extracted role title",
    "company_type": "startup|mid_size|enterprise|unknown",
    "experience_level": "entry|mid|senior",
    "key_responsibilities": ["resp1", "resp2"],
    "culture_hints": ["hint1", "hint2"]
  }
}

Be specific, practical, and actionable. Provide at least 5 items for each array field.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const analysis = JSON.parse(text);
    return { success: true, data: analysis };
  } catch (error) {
    console.error('Gemini API error:', error.message);

    // Handle specific error types
    if (error.message.includes('JSON')) {
      return {
        success: false,
        message: 'AI returned invalid format. Please try again.',
      };
    }

    return {
      success: false,
      message: 'AI analysis failed. Please try again later.',
    };
  }
};

module.exports = { analyzeJobDescription };
