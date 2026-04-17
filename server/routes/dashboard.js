import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { getWorkloadStatus, calculateProductivityScore } from '../utils/allocator.js';
import { generateProductivityInsights } from '../utils/ai.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find();

    const totalEmployees = employees.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

    const avgProductivity = totalEmployees > 0
      ? Math.round(employees.reduce((sum, e) => {
          const score = calculateProductivityScore(e.completedTasks, e.totalTasks);
          return sum + score;
        }, 0) / totalEmployees)
      : 0;

    const overloadedCount = employees.filter(e => e.workload > 80).length;

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

router.get('/team-overview', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find();

    const teamData = employees.map(employee => {
      const employeeTasks = tasks.filter(t =>
        t.assignedTo === employee.userId
      );
      const completedCount = employeeTasks.filter(t => t.status === 'Completed').length;
      const productivityScore = calculateProductivityScore(completedCount, employeeTasks.length);
      const workloadStatus = getWorkloadStatus(employee.workload);

      return {
        _id: employee._id,
        userId: employee.userId,
        name: employee.name,
        skills: employee.skills,
        performanceScore: employee.performanceScore,
        workload: employee.workload,
        workloadStatus,
        productivityScore,
        taskCount: employeeTasks.length,
        completedTaskCount: completedCount,
        stressLevel: employee.stressLevel,
        status: employee.status
      };
    });

    res.json(teamData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/workload-distribution', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });

    const distribution = {
      low: employees.filter(e => e.workload < 40).length,
      balanced: employees.filter(e => e.workload >= 40 && e.workload <= 80).length,
      overloaded: employees.filter(e => e.workload > 80).length
    };

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

router.get('/leaderboard', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    
    const leaderboard = employees.map(emp => {
      // Productivity score calculation: (completed tasks / total tasks) * performanceScore
      const completionRate = emp.totalTasks > 0 ? (emp.completedTasks / emp.totalTasks) : 0;
      const score = Math.round((completionRate * 0.7 + (emp.performanceScore / 100) * 0.3) * 100);
      
      return {
        name: emp.name,
        userId: emp.userId,
        score: score,
        completedTasks: emp.completedTasks,
        performanceScore: emp.performanceScore
      };
    })
    .sort((a, b) => b.score - a.score); // Return everyone sorted by score

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
