import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { createNotification } from './notifications.js';
import { findBestEmployee } from '../utils/allocator.js';
import { generateTaskAllocationExplanation, generateManagerSuggestion, generateAITaskAssignment } from '../utils/ai.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = {};
    
    // Security: Employees only see their own tasks
    if (req.user.role === 'employee') {
      query.assignedTo = req.user.id;
    } else if (employeeId) {
      query.assignedTo = employeeId;
    }

    if (status) query.status = status;

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    
    // Manual population since assignedTo is now a String
    const populatedTasks = await Promise.all(tasks.map(async (task) => {
      const emp = await User.findOne({ userId: task.assignedTo });
      return {
        ...task.toObject(),
        assignedTo: emp ? { name: emp.name, skills: emp.skills, userId: emp.userId } : task.assignedTo
      };
    }));
    
    res.json(populatedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const emp = await User.findOne({ userId: task.assignedTo });
    
    res.json({
      ...task.toObject(),
      assignedTo: emp ? { name: emp.name, skills: emp.skills, userId: emp.userId } : task.assignedTo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/auto-assign', async (req, res) => {
  try {
    const { title, description, priority, requiredSkills, estimatedHours, deadline } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'requiredSkills array is required' });
    }

    // Fetch all employees from MongoDB
    const employees = await User.find({ role: 'employee' }); // filter out admins if they shouldn't get tasks
    if (employees.length === 0) {
      return res.status(400).json({ error: 'No employees found in database' });
    }

    // Filter employees who possess at least one of the required skills
    const filteredEmployees = employees.filter(employee => {
      if (!employee.skills || !Array.isArray(employee.skills)) return false;
      return requiredSkills.some(reqSkill =>
        employee.skills.some(skill => skill.toLowerCase().includes(reqSkill.toLowerCase()))
      );
    });

    if (filteredEmployees.length === 0) {
      return res.status(400).json({ error: 'No employees with matching skills found' });
    }

    // Use AI to select the best employee
    let aiAssignment;
    try {
      aiAssignment = await generateAITaskAssignment(title, requiredSkills, filteredEmployees);
    } catch (aiError) {
      console.error('AI assignment failed, using fallback:', aiError.message);
      // Fallback
      const employee = filteredEmployees[0];
      aiAssignment = {
        userId: employee.userId,
        reason: `Selected based on skill match and performance score of ${employee.performanceScore}%`
      };
    }

    // Find the selected employee by userId
    const selectedEmployee = filteredEmployees.find(emp => emp.userId === aiAssignment.userId);
    if (!selectedEmployee) {
      return res.status(400).json({ error: 'Selected employee not found' });
    }

    // Create and save the task
    const task = new Task({
      title,
      description,
      priority,
      requiredSkills,
      estimatedHours,
      deadline,
      assignedTo: selectedEmployee.userId, // Store string ID as requested
      status: 'Pending', // Exact match
      aiExplanation: aiAssignment.reason
    });

    await task.save();

    // Update employee workload
    selectedEmployee.workload = Math.min(100, (selectedEmployee.workload || 0) + (estimatedHours * 5));
    selectedEmployee.currentLoad = (selectedEmployee.currentLoad || 0) + 1;
    selectedEmployee.totalTasks = (selectedEmployee.totalTasks || 0) + 1;

    if (selectedEmployee.workload > 80) {
      selectedEmployee.status = 'overloaded';
    } else if (selectedEmployee.workload > 40) {
      selectedEmployee.status = 'busy';
    } else {
      selectedEmployee.status = 'available';
    }

    await selectedEmployee.save();

    // Create notification for employee
    await createNotification(
      selectedEmployee.userId, // Changed to string reference
      `New task "${title}" has been assigned to you`,
      'task_assigned',
      task._id
    );

    res.json({
      task: {
        ...task.toObject(),
        assignedTo: {
          name: selectedEmployee.name,
          skills: selectedEmployee.skills,
          userId: selectedEmployee.userId
        }
      },
      employee: {
        id: selectedEmployee._id,
        userId: selectedEmployee.userId,
        name: selectedEmployee.name,
        skills: selectedEmployee.skills
      },
      aiExplanation: aiAssignment.reason
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/suggest', async (req, res) => {
  try {
    const { title, requiredSkills, priority } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'requiredSkills array is required' });
    }

    const employees = await User.find({ role: 'employee' });

    const suggestion = await generateManagerSuggestion(
      { title, requiredSkills, priority },
      employees
    );

    res.json({ suggestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // e.g. "Completed"
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const previousStatus = task.status;
    task.status = status;

    if (status === 'Completed' && previousStatus !== 'Completed') {
      task.completionTime = new Date();
      const employee = await User.findOne({ userId: task.assignedTo });
      if (employee) {
        employee.completedTasks += 1;
        employee.workload = Math.max(0, employee.workload - (task.estimatedHours * 5));
        if (employee.workload < 40) {
          employee.status = 'available';
        } else if (employee.workload <= 80) {
          employee.status = 'busy';
        }
        await employee.save();
      }
    }

    await task.save();
    
    const emp = await User.findOne({ userId: task.assignedTo });
    res.json({
      ...task.toObject(),
      assignedTo: emp ? { name: emp.name, skills: emp.skills, userId: emp.userId } : task.assignedTo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const emp = await User.findOne({ userId: task.assignedTo });
    res.json({
      ...task.toObject(),
      assignedTo: emp ? { name: emp.name, skills: emp.skills, userId: emp.userId } : task.assignedTo
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
