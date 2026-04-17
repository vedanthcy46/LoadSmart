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

    // Use AI to split the task and assign to employees
    let aiResult;
    try {
      aiResult = await generateAITaskAssignment(title, description, requiredSkills, estimatedHours, filteredEmployees);
    } catch (aiError) {
      console.error('AI assignment failed, using fallback:', aiError.message);
      // Fallback: assign everything to the first eligible person
      aiResult = {
        assignments: [{
          employeeId: filteredEmployees[0].userId,
          assignedSkill: requiredSkills[0],
          hours: estimatedHours,
          reason: "Selected as fallback due to AI service error."
        }]
      };
    }

    const createdTasks = [];
    const updatedEmployees = [];

    // Process each assignment from AI
    for (const assignment of aiResult.assignments) {
      const selectedEmployee = filteredEmployees.find(emp => emp.userId === assignment.employeeId);
      if (!selectedEmployee) continue;

      // Create a split task entry
      const taskTitle = aiResult.assignments.length > 1 
        ? `${title} [${assignment.assignedSkill}]` 
        : title;

      const task = new Task({
        title: taskTitle,
        description,
        priority,
        requiredSkills: [assignment.assignedSkill],
        estimatedHours: assignment.hours,
        deadline,
        assignedTo: selectedEmployee.userId,
        status: 'Pending',
        aiExplanation: assignment.reason
      });

      await task.save();
      createdTasks.push(task);

      // Update employee workload based on hours
      // Logic: 1 hour of work adds 2.5% workload (40 hours = 100% workload)
      const workloadImpact = assignment.hours * 2.5;
      selectedEmployee.workload = Math.min(100, (selectedEmployee.workload || 0) + workloadImpact);
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
      updatedEmployees.push({
        id: selectedEmployee._id,
        userId: selectedEmployee.userId,
        name: selectedEmployee.name,
        assignedHours: assignment.hours,
        assignedSkill: assignment.assignedSkill
      });

      // Create notification for employee
      await createNotification(
        selectedEmployee.userId,
        `New task "${taskTitle}" (${assignment.hours} hrs) has been assigned to you`,
        'task_assigned',
        task._id
      );
    }

    res.json({
      tasks: createdTasks,
      employees: updatedEmployees,
      assignments: aiResult.assignments
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
