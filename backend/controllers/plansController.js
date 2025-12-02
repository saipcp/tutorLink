import pool from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { generateStudyPlanWithAI } from "../utils/openai.js";

export const getPlans = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [plans] = await pool.execute(
      "SELECT * FROM study_plans WHERE userId = ? ORDER BY createdAt DESC",
      [userId]
    );

    // Get plan items for each plan
    const plansWithItems = await Promise.all(
      plans.map(async (plan) => {
        const [items] = await pool.execute(
          "SELECT * FROM plan_items WHERE planId = ? ORDER BY dayIndex, createdAt",
          [plan.id]
        );
        return { ...plan, items };
      })
    );

    res.json(plansWithItems);
  } catch (error) {
    next(error);
  }
};

export const generateStudyPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjects, topics, duration, dailyHours, goals, currentLevel } =
      req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "Subjects array is required" });
    }

    // Get subject IDs and their topics
    const placeholders = subjects.map(() => "?").join(",");
    const [subjectRows] = await pool.execute(
      `SELECT id, name FROM subjects WHERE name IN (${placeholders})`,
      subjects
    );

    if (subjectRows.length === 0) {
      return res.status(400).json({ error: "No valid subjects found" });
    }

    // Get all topics for the selected subjects
    const subjectDetails = await Promise.all(
      subjectRows.map(async (subject) => {
        const [topicRows] = await pool.execute(
          "SELECT id, name FROM topics WHERE subjectId = ?",
          [subject.id]
        );
        return {
          id: subject.id,
          name: subject.name,
          topics: topicRows,
        };
      })
    );

    // Generate study plan using OpenAI
    const aiGeneratedPlan = await generateStudyPlanWithAI({
      subjects,
      topics: topics || [],
      duration: duration || 7,
      dailyHours: dailyHours || 2,
      goals: goals || [],
      currentLevel: currentLevel || "beginner",
      subjectDetails,
    });

    const planId = uuidv4();
    const goalSummary =
      aiGeneratedPlan.planTitle ||
      `AI-Generated ${duration || 7}-day study plan for ${subjects.join(", ")}`;

    // Create plan in database
    await pool.execute(
      `INSERT INTO study_plans (id, userId, generatedAt, goalSummary, metadata)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      [
        planId,
        userId,
        goalSummary,
        JSON.stringify({
          adaptiveLevel: currentLevel || "beginner",
          totalHours: (dailyHours || 2) * (duration || 7),
          subjects,
          goals: goals || [],
          generatedBy: "OpenAI-GPT-4o-mini",
          description: aiGeneratedPlan.description,
          studyTips: aiGeneratedPlan.studyTips || [],
          milestones: aiGeneratedPlan.milestones || [],
        }),
      ]
    );

    // Process AI-generated sessions and insert into database
    const planItems = [];

    for (const session of aiGeneratedPlan.sessions || []) {
      // Find matching subject and topic from database
      const subject = subjectDetails.find(
        (s) => s.name.toLowerCase() === session.subjectName.toLowerCase()
      );

      if (!subject) continue;

      const topic = subject.topics.find(
        (t) => t.name.toLowerCase() === session.topicName.toLowerCase()
      );

      // Use topic if found, otherwise use first available topic for the subject
      const selectedTopic = topic || subject.topics[0];

      if (!selectedTopic) continue;

      const itemId = uuidv4();
      const metadata = {
        sessionType: session.sessionType || "theory",
        difficulty: session.difficulty || 1,
        description: session.description || "",
        resources: session.resources || [],
      };

      planItems.push({
        id: itemId,
        planId,
        subjectId: subject.id,
        topicId: selectedTopic.id,
        title: session.title,
        targetMins: session.targetMins || 60,
        dayIndex: session.dayIndex || 0,
        completed: false,
        metadata: JSON.stringify(metadata),
      });
    }

    // Insert plan items
    for (const item of planItems) {
      await pool.execute(
        `INSERT INTO plan_items (id, planId, subjectId, topicId, title, targetMins, dayIndex, completed, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.planId,
          item.subjectId,
          item.topicId,
          item.title,
          item.targetMins,
          item.dayIndex,
          item.completed,
          item.metadata,
        ]
      );
    }

    // Return created plan with items
    const [newPlan] = await pool.execute(
      "SELECT * FROM study_plans WHERE id = ?",
      [planId]
    );
    const [items] = await pool.execute(
      "SELECT * FROM plan_items WHERE planId = ?",
      [planId]
    );

    res.status(201).json({
      ...newPlan[0],
      items,
      metadata:
        typeof newPlan[0].metadata === "string"
          ? JSON.parse(newPlan[0].metadata || "{}")
          : newPlan[0].metadata || {},
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlanItem = async (req, res, next) => {
  try {
    const { planId, itemId } = req.params;
    const { completed } = req.body;

    // Verify plan belongs to user
    const [plans] = await pool.execute(
      "SELECT userId FROM study_plans WHERE id = ?",
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plans[0].userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.execute(
      "UPDATE plan_items SET completed = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND planId = ?",
      [completed, itemId, planId]
    );

    res.json({ message: "Plan item updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [plans] = await pool.execute(
      "SELECT userId FROM study_plans WHERE id = ?",
      [id]
    );
    if (plans.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plans[0].userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.execute("DELETE FROM study_plans WHERE id = ?", [id]);

    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    next(error);
  }
};
