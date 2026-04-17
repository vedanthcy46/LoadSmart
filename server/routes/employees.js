import express from 'express';
import crypto from 'crypto';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import { getWorkloadStatus, calculateProductivityScore } from '../utils/allocator.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-password');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, password, skills, capacity } = req.body;

    // Validate required fields
    if (!name || !email || !password || !skills || !capacity) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, password, skills, capacity'
      });
    }

    // Ensure skills is an array
    const skillsArray = Array.isArray(skills) ? skills : [skills];

    if (skillsArray.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' });
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create employee with auto-generated employeeId
    const employee = new Employee({
      name,
      email,
      password, // Pass plain password, pre-save hook will hash it
      skills: skillsArray,
      capacity: Number(capacity),
      role: 'employee',
      performanceScore: 50,
      currentLoad: 0
    });

    await employee.save();

    // Remove password from response
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(201).json(employeeResponse);
  } catch (error) {
    console.error('Employee creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/stress', async (req, res) => {
  try {
    const { stressLevel, stressNote } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { stressLevel, stressNote },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const tasks = await Task.find({ assignedTo: req.params.id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const productivityScore = calculateProductivityScore(completedTasks, tasks.length);
    const workloadStatus = getWorkloadStatus(employee.workload);

    res.json({
      ...employee.toObject(),
      productivityScore,
      workloadStatus,
      taskCount: tasks.length,
      completedTaskCount: completedTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
