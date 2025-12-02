import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a personalized study plan using OpenAI
 * @param {Object} params - Study plan parameters
 * @param {string[]} params.subjects - Array of subject names
 * @param {string[]} params.topics - Array of specific topics (optional)
 * @param {number} params.duration - Duration in days
 * @param {number} params.dailyHours - Daily study hours
 * @param {string[]} params.goals - Learning goals
 * @param {string} params.currentLevel - Current skill level (beginner/intermediate/advanced)
 * @param {Object[]} params.subjectDetails - Detailed subject information from database
 * @returns {Promise<Object>} Generated study plan structure
 */
export async function generateStudyPlanWithAI({
  subjects,
  topics = [],
  duration,
  dailyHours,
  goals = [],
  currentLevel,
  subjectDetails,
}) {
  const prompt = `You are an expert educational planner. Create a personalized study plan with the following requirements:

**Study Parameters:**
- Subjects: ${subjects.join(", ")}
${topics.length > 0 ? `- Specific Topics: ${topics.join(", ")}` : ""}
- Duration: ${duration} days
- Daily Study Time: ${dailyHours} hours
- Current Level: ${currentLevel}
${goals.length > 0 ? `- Learning Goals: ${goals.join(", ")}` : ""}

**Available Topics by Subject:**
${subjectDetails
  .map(
    (subject) =>
      `${subject.name}: ${subject.topics.map((t) => t.name).join(", ")}`
  )
  .join("\n")}

**Requirements:**
1. Create a day-by-day study plan distributing ${dailyHours} hours across all ${duration} days
2. Break down each day into focused study sessions
3. Balance theory, practice, review, and assessment sessions
4. Adapt difficulty and pacing to ${currentLevel} level
5. Use the available topics from the database
6. Include specific learning objectives for each session
7. Progressively increase difficulty throughout the plan
8. Include periodic review and assessment sessions

**Response Format (JSON):**
Return a JSON object with this structure:
{
  "planTitle": "descriptive title for the study plan",
  "description": "brief overview of the study plan approach",
  "sessions": [
    {
      "dayIndex": 0,
      "subjectName": "subject name from the provided list",
      "topicName": "topic name from the available topics",
      "title": "session title with emoji (e.g., 📚 Learn Basics, ✏️ Practice, 🔄 Review, 📝 Assessment)",
      "description": "specific learning objectives and activities",
      "targetMins": number of minutes (distribute the ${dailyHours * 60} mins),
      "sessionType": "theory|practice|review|assessment",
      "difficulty": 1-3 (1=easy, 2=medium, 3=hard),
      "resources": ["recommended resource 1", "recommended resource 2"]
    }
  ],
  "studyTips": ["tip 1", "tip 2", "tip 3"],
  "milestones": [
    {
      "day": day number,
      "description": "what should be achieved by this day"
    }
  ]
}

Ensure the plan:
- Covers all ${duration} days (dayIndex from 0 to ${duration - 1})
- Distributes study time evenly across subjects
- Adapts to ${currentLevel} level with appropriate pacing
- Includes varied session types for effective learning`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational planner specializing in creating personalized, effective study plans. You understand learning science, spaced repetition, and adaptive difficulty. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(`Failed to generate study plan with AI: ${error.message}`);
  }
}

/**
 * Get study recommendations based on progress
 */
export async function getStudyRecommendations({
  completedSessions,
  upcomingSessions,
  performance,
}) {
  const prompt = `Based on the following study progress, provide recommendations:

**Completed Sessions:** ${completedSessions} sessions
**Upcoming Sessions:** ${upcomingSessions} sessions  
**Performance Metrics:** ${JSON.stringify(performance)}

Provide 3-5 actionable recommendations to improve learning effectiveness.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a study coach providing brief, actionable recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Continue with your current study plan and maintain consistency.";
  }
}

export default openai;
