import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { createNotification } from './notifications.js';
import { findBestEmployee } from '../utils/allocator.js';
import { generateTaskAllocationExplanation, generateManagerSuggestion, generateAITaskAssignment } from '../utils/ai.js';
import { authenticateToken } from '../middleware/auth.js';
import { refreshWorkload } from '../utils/workload.js';

const router = express.Router();

// ===== GET ALL TASKS =====
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

// ===== GET SINGLE TASK =====
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

// ===== CREATE TASK (MANUAL) =====
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    // Recalculate workload using the correct formula
    if (task.assignedTo) await refreshWorkload(task.assignedTo);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== AI AUTO-ASSIGN =====
router.post('/auto-assign', async (req, res) => {
  try {
    const { title, description, priority, requiredSkills, estimatedHours, deadline } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'requiredSkills array is required' });
    }

    const employees = await User.find({ role: 'employee' });
    if (employees.length === 0) {
      return res.status(400).json({ error: 'No employees found in database' });
    }

    // 🧠 SMART TASK ASSIGNMENT RULE:
    // Only consider employees with workload < 80% AND stressLevel <= 3
    const filteredEmployees = employees.filter(employee => {
      if (!employee.skills || !Array.isArray(employee.skills)) return false;
      
      // Check skill match
      const hasSkill = requiredSkills.some(reqSkill =>
        employee.skills.some(skill => skill.toLowerCase().includes(reqSkill.toLowerCase()))
      );
      
      // Check workload and stress constraints
      const isAvailable = (employee.workload || 0) < 80 && (employee.stressLevel || 1) <= 3;
      
      return hasSkill && isAvailable;
    });

    if (filteredEmployees.length === 0) {
      return res.status(400).json({ error: 'No eligible employees found (all matching employees are overloaded or stressed)' });
    }

    // Use AI to split the task and assign to employees
    let aiResult;
    try {
      aiResult = await generateAITaskAssignment(title, description, requiredSkills, estimatedHours, filteredEmployees);
    } catch (aiError) {
      console.error('AI assignment failed, using fallback:', aiError.message);
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

      // ✅ Use refreshWorkload for CORRECT formula: (totalHours / capacity) * 100
      await refreshWorkload(selectedEmployee.userId);

      // Update total tasks counter
      selectedEmployee.totalTasks = (selectedEmployee.totalTasks || 0) + 1;
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

// ===== REASSIGN OVERLOADED =====
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

    // ✅ Recalculate ALL affected employees using the correct formula
    await refreshWorkload(userId); // Old owner
    for (const item of reassignments) {
      await refreshWorkload(item.newEmployeeId); // New owners
    }

    res.json({ message: 'Reassignment successful', results });
  } catch (error) {
    console.error('Reassignment Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== AI SUGGESTION =====
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

// ===== UPDATE TASK STATUS =====
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (req.user.role === 'employee' && status === 'Completed') {
      return res.status(403).json({ error: 'Employees cannot mark tasks as Completed. Please submit for "Under Review" instead.' });
    }

    // MUST fetch the task FIRST before referencing it
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (status === 'Under Review' && req.user.role === 'employee') {
      await createNotification(
        'admin',
        `Employee ${req.user.username || req.user.id} submitted "${task.title}" for review.`,
        'task_review',
        task._id
      );
    }

    const previousStatus = task.status;
    task.status = status;

    // 🔄 AUTO CAPACITY ADJUSTMENT on task completion
    if (status === 'Completed' && previousStatus !== 'Completed') {
      task.completionTime = new Date();
      const employee = await User.findOne({ userId: task.assignedTo });
      if (employee) {
        employee.completedTasks += 1;

        // Recalculate productivity for capacity adjustment decision
        const allTasks = await Task.find({ assignedTo: employee.userId });
        const completedCount = allTasks.filter(t => t.status === 'Completed').length + 1; // +1 for this task
        const prodScore = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;
        employee.productivityScore = prodScore;
        
        // Case 1: High Performer (productivity > 80%, stress < 3, workload < 70%)
        if (prodScore > 80 && employee.stressLevel < 3 && employee.workload < 70) {
          employee.capacity = Math.min(20, (employee.capacity || 6) + 1);
          console.log(`[Capacity] Increased for ${employee.userId} → ${employee.capacity}h (High Performance)`);
        } 
        // Case 2: Overloaded/Stressed (workload > 85%, stress > 3)
        else if (employee.workload > 85 && employee.stressLevel > 3) {
          employee.capacity = Math.max(2, (employee.capacity || 6) - 1);
          console.log(`[Capacity] Reduced for ${employee.userId} → ${employee.capacity}h (Overloaded/Stressed)`);
        }

        await employee.save();
      }
    }

    await task.save();
    
    // ✅ Always recalculate using the correct formula after any status change
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

// ===== UPDATE TASK =====
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
    
    // ✅ Recalculate both old and new assignees
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

// ===== DELETE TASK =====
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const assignee = task.assignedTo;
    await Task.findByIdAndDelete(req.params.id);
    
    // ✅ Recalculate after deletion
    if (assignee) await refreshWorkload(assignee);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
