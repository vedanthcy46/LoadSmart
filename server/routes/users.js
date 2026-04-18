import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { getWorkloadStatus, calculateProductivityScore } from '../utils/allocator.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    const tasks = await Task.find();

    const teamData = employees.map(employee => {
      const employeeTasks = tasks.filter(t => t.assignedTo === employee.userId);
      const activeTasks = employeeTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
      const dynamicWorkload = Math.round((activeTasks / (employee.capacity || 50)) * 100);
      const completedCount = employeeTasks.filter(t => t.status === 'Completed').length;
      const productivityScore = calculateProductivityScore(completedCount, employeeTasks.length);
      const workloadStatus = getWorkloadStatus(dynamicWorkload);

      return {
        ...employee.toObject(),
        workload: dynamicWorkload,
        workloadStatus,
        productivityScore,
        taskCount: employeeTasks.length,
        completedTaskCount: completedCount
      };
    });

    res.json(teamData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id })
      .select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  console.log('[User Create Debug] Incoming POST request from:', req.user.id);
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, password, role, skills, capacity, userId } = req.body;
    console.log('[User Create Debug] Request Body:', { name, email, role, userId });

    // Validation
    if (!name || !email || (!password && req.body.password !== undefined)) {
        return res.status(400).json({ error: 'Missing required fields: name, email, and password are required' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('[User Create Debug] Email already exists:', email);
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if userId already exists (if provided)
    if (userId) {
      const existingUser = await User.findOne({ userId });
      if (existingUser) {
        console.log('[User Create Debug] User ID already exists:', userId);
        return res.status(400).json({ error: 'User ID already exists' });
      }
    }

    // Auto-generate userId if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      let count = await User.countDocuments();
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 100) {
        attempts++;
        const nextId = (role === 'admin' ? 'ADM' : 'EMP') + (count + attempts).toString().padStart(3, '0');
        const existing = await User.findOne({ userId: nextId });
        if (!existing) {
          finalUserId = nextId;
          isUnique = true;
        }
      }
    }

    const user = new User({
      userId: finalUserId,
      name,
      email,
      password,
      role: role || 'employee',
      skills: skills || [],
      capacity: capacity || 50
    });

    await user.save();
    console.log('[User Create Debug] User created successfully:', finalUserId);

    const response = user.toObject();
    delete response.password;
    res.status(201).json(response);
  } catch (error) {
    console.error('[User Create Debug] Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update user (Admin or Self)
router.put('/:id', authenticateToken, async (req, res) => {
  console.log(`[User Update Debug] Updating user: ${req.params.id} (Request from: ${req.user.id})`);
  try {
    // Permission check: Admin or the user themselves
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      console.log(`[User Update Debug] Access denied for user: ${req.user.id} trying to edit ${req.params.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, password, skills, capacity, email } = req.body;
    console.log(`[User Update Debug] Payload for ${req.params.id}:`, { name, email, skillsCount: skills?.length });

    const user = await User.findOne({ userId: req.params.id });

    if (!user) {
      console.log(`[User Update Debug] User not found: ${req.params.id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new email already exists (excluding this user)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, userId: { $ne: user.userId } });
      if (existingEmail) {
        console.log(`[User Update Debug] Email already exists: ${email}`);
        return res.status(400).json({ error: 'Email already exists' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (password) user.password = password; 
    if (skills) user.skills = skills;
    if (capacity) user.capacity = Number(capacity);

    await user.save();
    console.log(`[User Update Debug] User ${req.params.id} updated successfully`);

    const response = user.toObject();
    delete response.password;
    res.json(response);
  } catch (error) {
    console.error(`[User Update Debug] Update failed:`, error);
    res.status(400).json({ error: error.message });
  }
});

// Get user stats (Performance/Dashboard)
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tasks = await Task.find({ assignedTo: user.userId });
    
    const taskCount = tasks.length;
    const completedTaskCount = tasks.filter(t => t.status === 'Completed').length;
    const productivityScore = calculateProductivityScore(completedTaskCount, taskCount);

    res.json({
      userId: user.userId,
      name: user.name,
      skills: user.skills,
      performanceScore: user.performanceScore,
      workload: user.workload,
      status: user.status,
      taskCount,
      completedTaskCount,
      productivityScore,
      stressLevel: user.stressLevel,
      stressNote: user.stressNote,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user stress (Employee or Admin)
router.put('/:id/stress', authenticateToken, async (req, res) => {
  try {
    const { stressLevel, stressNote } = req.body;
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { stressLevel, stressNote },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findOneAndDelete({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete associated tasks or unassign them?
    // For now, just delete the user.
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Award badge to user (Admin only)
router.post('/:id/badge', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { badge } = req.body;
    const user = await User.findOne({ userId: req.params.id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
    }

    res.json({ message: 'Badge awarded successfully', badges: user.badges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
