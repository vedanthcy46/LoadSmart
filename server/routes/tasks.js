import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { createNotification } from './notifications.js';
import { findBestEmployee } from '../utils/allocator.js';
import { generateTaskAllocationExplanation, generateManagerSuggestion, generateAITaskAssignment } from '../utils/ai.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to recalculate employee workload and status
const refreshWorkload = async (userId) => {
  if (!userId) return;
  try {
    const user = await User.findOne({ userId });
    if (!user) return;

    const activeTasks = await Task.find({ 
      assignedTo: userId, 
      status: { $in: ['Pending', 'In Progress', 'Under Review'] } 
    });

    // Each hour of estimated work adds 2.5% to workload (40 hours = 100%)
    const totalHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    user.workload = Math.min(100, totalHours * 2.5);
    user.currentLoad = activeTasks.length;

    if (user.workload > 80) user.status = 'overloaded';
    else if (user.workload > 40) user.status = 'busy';
    else user.status = 'available';

    await user.save();
    console.log(`[Workload Sync] Updated ${userId}: ${user.workload}% (${activeTasks.length} tasks)`);
  } catch (err) {
    console.error(`[Workload Sync] Failed for ${userId}:`, err);
  }
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = {};
    
    // Security: Employees see their own tasks AND tasks offloaded from them
    if (req.user.role === 'employee') {
      query.$or = [
        { assignedTo: req.user.id },
        { previousAssignee: req.user.id }
      ];
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
    if (task.assignedTo) await refreshWorkload(task.assignedTo);
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

router.post('/reassign-overloaded/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Find the overloaded employee
    const overloadedEmp = await User.findOne({ userId });
    if (!overloadedEmp) return res.status(404).json({ error: 'Employee not found' });

    // 2. Find their active tasks
    const tasks = await Task.find({ 
      assignedTo: userId, 
      status: { $in: ['Pending', 'In Progress'] } 
    });

    if (tasks.length === 0) {
      return res.status(400).json({ error: 'No active tasks found for this employee to reassign.' });
    }

    // 3. Get all other employees
    const otherEmployees = await User.find({ 
      userId: { $ne: userId },
      role: 'employee'
    });

    if (otherEmployees.length === 0) {
      return res.status(400).json({ error: 'No other employees available for reassignment.' });
    }

    // 4. Use AI to find best reassignment
    const { generateAIReassignment } = await import('../utils/ai.js');
    const reassignments = await generateAIReassignment(tasks, otherEmployees);

    if (reassignments.length === 0) {
      return res.status(500).json({ error: 'AI failed to suggest reassignments. Please try manual reassignment.' });
    }

    const results = [];

    // 5. Execute reassignments
    for (const item of reassignments) {
      const task = await Task.findById(item.taskId);
      const newEmp = await User.findOne({ userId: item.newEmployeeId });

      if (task && newEmp) {
        // Update task
        task.previousAssignee = task.assignedTo; // Store old owner
        task.assignedTo = newEmp.userId;
        task.aiExplanation = `Automatically reassigned from ${overloadedEmp.name}: ${item.reason}`;
        await task.save();

        // Update workloads
        const workloadImpact = task.estimatedHours * 2.5;
        
        // Remove from old
        overloadedEmp.workload = Math.max(0, (overloadedEmp.workload || 0) - workloadImpact);
        overloadedEmp.currentLoad = Math.max(0, (overloadedEmp.currentLoad || 0) - 1);
        
        // Add to new
        newEmp.workload = Math.min(100, (newEmp.workload || 0) + workloadImpact);
        newEmp.currentLoad = (newEmp.currentLoad || 0) + 1;
        newEmp.totalTasks = (newEmp.totalTasks || 0) + 1;

        // Recalculate statuses
        [overloadedEmp, newEmp].forEach(emp => {
          if (emp.workload > 80) emp.status = 'overloaded';
          else if (emp.workload > 40) emp.status = 'busy';
          else emp.status = 'available';
        });

        await overloadedEmp.save();
        await newEmp.save();

        // Notify new employee
        await createNotification(
          newEmp.userId,
          `Task "${task.title}" has been reassigned to you from ${overloadedEmp.name} (AI Optimization)`,
          'task_assigned',
          task._id
        );

        results.push({ task: task.title, to: newEmp.name });
      }
    }

    res.json({ message: 'Reassignment successful', results });
  } catch (error) {
    console.error('Reassignment Error:', error);
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

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body; // e.g. "Completed", "In Progress"
    
    if (req.user.role === 'employee' && status === 'Completed') {
      return res.status(403).json({ error: 'Employees cannot mark tasks as Completed. Please submit for "Under Review" instead.' });
    }

    if (status === 'Under Review' && req.user.role === 'employee') {
      // Notify Admin that a task is ready for review
      await createNotification(
        'admin', // Assuming 'admin' is the generic identifier or logic handles it
        `Employee ${req.user.username} submitted "${task.title}" for review.`,
        'task_review',
        task._id
      );
    }

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
    
    // Sync workloads for the involved user
    await refreshWorkload(task.assignedTo);

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
    const oldTask = await Task.findById(req.params.id);
    const oldAssignee = oldTask?.assignedTo;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Sync both old and new assignees
    if (oldAssignee) await refreshWorkload(oldAssignee);
    if (task.assignedTo && task.assignedTo !== oldAssignee) await refreshWorkload(task.assignedTo);

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
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const assignee = task.assignedTo;
    await Task.findByIdAndDelete(req.params.id);
    
    if (assignee) await refreshWorkload(assignee);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
