import express from 'express';
import Feedback from '../models/Feedback.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateEmployeeTips } from '../utils/ai.js';

const router = express.Router();

// Submit feedback (Employee)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, stressLevel } = req.body;
    const employeeId = req.user.id; // Corrected from req.user.userId
    
    console.log(`[Feedback] Submission from ${employeeId}, stress: ${stressLevel}`);

    if (!message || stressLevel === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate AI Tips (Private to employee)
    let aiTips = [];
    try {
      aiTips = await generateEmployeeTips(message, stressLevel);
    } catch (aiError) {
      console.error('[Feedback] AI Generation failed:', aiError);
      // Continue without tips if AI fails, don't crash the whole submission
    }

    const feedback = new Feedback({
      employeeId,
      message,
      stressLevel,
      aiTips
    });

    await feedback.save();
    console.log(`[Feedback] Saved successfully for ${employeeId}`);
    
    // Return AI tips immediately to the employee
    res.status(201).json({ 
      message: "Feedback submitted", 
      aiTips: feedback.aiTips 
    });
  } catch (error) {
    console.error('[Feedback] Critical Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all feedback (Admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Admin sees everything EXCEPT aiTips
    const feedbacks = await Feedback.find()
      .select('-aiTips')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('[Feedback] Fetch Error (Admin):', error);
    res.status(500).json({ error: error.message });
  }
});

// Get my tips (Employee)
router.get('/my-tips', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Corrected from req.user.userId
    
    // Employee sees ONLY their tips, NOT their raw feedback messages (as per requirement)
    const feedbacks = await Feedback.find({ employeeId: userId })
      .select('aiTips createdAt')
      .sort({ createdAt: -1 });
    
    res.json(feedbacks);
  } catch (error) {
    console.error('[Feedback] Fetch Error (MyTips):', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
