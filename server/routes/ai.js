import express from 'express';
import { analyzeStressLevel } from '../utils/ai.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/analyze-stress', async (req, res) => {
  console.log(`[AI Debug] Analyzing stress for user: ${req.body.userId || 'Anonymous'}`);
  
  if (!process.env.GROQ_API_KEY) {
    console.error('[AI Debug] GROQ_API_KEY is missing from environment variables!');
  }

  try {
    const { stressLevel, stressNote, userId } = req.body;
    const analysis = await analyzeStressLevel(stressNote, stressLevel);

    // If userId is provided, save the analysis to the user profile
    if (userId) {
      // Simple parsing for category
      let category = 'Low';
      if (analysis.toLowerCase().includes('high')) category = 'High';
      else if (analysis.toLowerCase().includes('medium')) category = 'Medium';

      console.log(`[AI Debug] Saving ${category} stress analysis for ${userId}`);
      await User.findOneAndUpdate({ userId }, {
        stressLevel,
        stressNote,
        stressCategory: category,
        stressAIAnalysis: analysis
      });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('[AI Debug] Route Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
