import express from 'express';
import Skill from '../models/Skill.js';

const router = express.Router();

// Get all skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.json(skills.map(s => s.name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new skill
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const trimmedName = name.trim();

    // Check if skill already exists (case-insensitive)
    const existingSkill = await Skill.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });

    if (existingSkill) {
      return res.status(400).json({ error: 'Skill already exists' });
    }

    const newSkill = new Skill({ name: trimmedName });
    await newSkill.save();

    res.status(201).json(newSkill.name);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Skill already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
