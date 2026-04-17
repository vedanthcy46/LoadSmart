import express from 'express';
import { analyzeStressLevel } from '../utils/ai.js';

const router = express.Router();

router.post('/analyze-stress', async (req, res) => {
  try {
    const { stressLevel, stressNote } = req.body;
    const analysis = await analyzeStressLevel(stressNote, stressLevel);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
