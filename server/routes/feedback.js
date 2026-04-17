import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// Submit feedback (Employee)
router.post('/', async (req, res) => {
  try {
    const { employeeId, message, stressLevel } = req.body;
    
    if (!employeeId || !message || stressLevel === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const feedback = new Feedback({
      employeeId,
      message,
      stressLevel
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all feedback (Admin)
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
