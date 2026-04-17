import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// GET profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let user = null;
    
    // Look up by userId
    user = await User.findOne({ userId: id }).select('-password');
    
    // Fallback to ObjectId if userId search failed
    if (!user && mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id).select('-password');
    }
    
    if (user) {
      return res.json({
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        skills: user.skills,
        capacity: user.capacity,
        performanceScore: user.performanceScore,
        currentLoad: user.currentLoad,
        createdAt: user.createdAt
      });
    }
    
    res.status(404).json({ error: 'Profile not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT profile update by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    let user = null;
    
    user = await User.findOne({ userId: id });
    
    if (!user && mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
    }
    
    if (user) {
      // Handle password update if provided
      if (updates.password) {
        user.password = updates.password; // Model pre-save hashes this
      }
      
      // Update allowed fields
      const allowedUpdates = ['name', 'skills', 'capacity'];
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'skills' && Array.isArray(updates[field])) {
            user[field] = updates[field];
          } else if (field === 'capacity') {
            user[field] = Number(updates[field]);
          } else {
            user[field] = updates[field];
          }
        }
      });
      
      await user.save();
      
      const updatedUser = user.toObject();
      delete updatedUser.password;
      
      return res.json(updatedUser);
    }
    
    res.status(404).json({ error: 'Profile not found' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
