import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { getWorkloadStatus, calculateProductivityScore } from '../utils/allocator.js';
import { generateProductivityInsights } from '../utils/ai.js';
import { refreshWorkload } from '../utils/workload.js';

const router = express.Router();

// ===== DASHBOARD STATS =====
router.get('/stats', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find();

    const totalEmployees = employees.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

    // Recalculate workload for ALL employees to ensure fresh data
    for (const emp of employees) {
      await refreshWorkload(emp.userId);
    }

    // Re-fetch after refresh
    const freshEmployees = await User.find({ role: 'employee' });

    // Calculate dynamic productivity for each employee and average
    const avgProductivity = totalEmployees > 0
      ? Math.round(freshEmployees.reduce((sum, e) => {
          const employeeTasks = tasks.filter(t => t.assignedTo === e.userId);
          const completedCount = employeeTasks.filter(t => t.status === 'Completed').length;
          const score = calculateProductivityScore(completedCount, employeeTasks.length);
          return sum + score;
        }, 0) / totalEmployees)
      : 0;

    // ✅ CORRECT: Use the refreshed workload from the database
    const overloadedCount = freshEmployees.filter(e => (e.workload || 0) > 80).length;

    const teamStats = { totalEmployees, totalTasks, completedTasks, avgProductivity, overloadedCount };
    const aiInsights = await generateProductivityInsights(teamStats);

    res.json({
      totalEmployees,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      avgProductivity,
      overloadedCount,
      aiInsights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TEAM OVERVIEW =====
router.get('/team-overview', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find();

    const teamData = employees.map(employee => {
      const employeeTasks = tasks.filter(t => t.assignedTo === employee.userId);
      
      // ✅ CORRECT: Use the stored workload (set by refreshWorkload formula)
      const activeTasks = employeeTasks.filter(t => 
        ['Pending', 'In Progress', 'In Review', 'Rejected'].includes(t.status)
      );
      const totalHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const capacity = employee.capacity || 6;
      const workload = Math.round((totalHours / capacity) * 100);
      
      const completedCount = employeeTasks.filter(t => t.status === 'Completed').length;
      const productivityScore = calculateProductivityScore(completedCount, employeeTasks.length);
      const workloadStatus = getWorkloadStatus(workload);

      return {
        _id: employee._id,
        userId: employee.userId,
        name: employee.name,
        email: employee.email,
        skills: employee.skills,
        performanceScore: employee.performanceScore,
        capacity,
        workload,
        currentLoadHours: totalHours,
        workloadStatus,
        productivityScore,
        taskCount: employeeTasks.length,
        completedTaskCount: completedCount,
        stressLevel: employee.stressLevel,
        status: workload > 80 ? 'overloaded' : workload >= 50 ? 'balanced' : 'available'
      };
    });

    res.json(teamData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WORKLOAD DISTRIBUTION =====
router.get('/workload-distribution', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find({ status: { $in: ['Pending', 'In Progress', 'In Review', 'Rejected'] } });

    let low = 0, balanced = 0, overloaded = 0;

    // ✅ CORRECT: Calculate workload using hours / capacity formula
    employees.forEach(e => {
      const empTasks = tasks.filter(t => t.assignedTo === e.userId);
      const totalHours = empTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const capacity = e.capacity || 6;
      const workload = Math.round((totalHours / capacity) * 100);
      
      if (workload < 50) low++;
      else if (workload <= 80) balanced++;
      else overloaded++;
    });

    res.json({ low, balanced, overloaded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TASK PRIORITY DISTRIBUTION =====
router.get('/task-priority-distribution', async (req, res) => {
  try {
    const tasks = await Task.find();

    const distribution = {
      high: tasks.filter(t => t.priority === 'High').length,
      medium: tasks.filter(t => t.priority === 'Medium').length,
      low: tasks.filter(t => t.priority === 'Low').length
    };

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== LEADERBOARD =====
router.get('/leaderboard', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find();
    
    const leaderboard = employees.map(emp => {
      const employeeTasks = tasks.filter(t => t.assignedTo === emp.userId);
      const completedCount = employeeTasks.filter(t => t.status === 'Completed').length;
      
      // Dynamic Productivity score calculation
      const completionRate = employeeTasks.length > 0 ? (completedCount / employeeTasks.length) : 0;
      // Formula: (70% Task Completion Rate + 30% Base Performance)
      const score = Math.round((completionRate * 0.7 + (emp.performanceScore / 100) * 0.3) * 100);
      
      return {
        name: emp.name,
        userId: emp.userId,
        score: score,
        completedTasks: completedCount,
        performanceScore: emp.performanceScore
      };
    })
    .sort((a, b) => b.score - a.score);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
