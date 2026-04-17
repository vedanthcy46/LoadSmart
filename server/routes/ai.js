import express from 'express';
import { analyzeStressLevel } from '../utils/ai.js';
import Employee from '../models/Employee.js';

const router = express.Router();

router.post('/analyze-stress', async (req, res) => {
  try {
    const { stressLevel, stressNote, userId } = req.body;
    const analysis = await analyzeStressLevel(stressNote, stressLevel);

    // If userId is provided, save the analysis to the employee profile
    if (userId) {
      // Simple parsing for category (look for Low/Medium/High in the text)
      let category = 'Low';
      if (analysis.toLowerCase().includes('high')) category = 'High';
      else if (analysis.toLowerCase().includes('medium')) category = 'Medium';

      await Employee.findByIdAndUpdate(userId, {
        stressLevel,
        stressNote,
        stressCategory: category,
        stressAIAnalysis: analysis
      });
    }

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
