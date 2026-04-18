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

    const overloadedCount = employees.filter(e => {
      const empActiveTasks = tasks.filter(t => t.assignedTo === e.userId && (t.status === 'Pending' || t.status === 'In Progress')).length;
      const dynWorkload = Math.round((empActiveTasks / (e.capacity || 50)) * 100);
      return dynWorkload > 80;
    }).length;

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
      const activeTasks = employeeTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
      const dynamicWorkload = Math.round((activeTasks / (employee.capacity || 50)) * 100);
      const completedCount = employeeTasks.filter(t => t.status === 'Completed').length;
      const productivityScore = calculateProductivityScore(completedCount, employeeTasks.length);
      const workloadStatus = getWorkloadStatus(dynamicWorkload);

      return {
        _id: employee._id,
        userId: employee.userId,
        name: employee.name,
        skills: employee.skills,
        performanceScore: employee.performanceScore,
        capacity: employee.capacity,
        workload: dynamicWorkload,
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

    const tasks = await Task.find({ status: { $in: ['Pending', 'In Progress'] } });

    let low = 0, balanced = 0, overloaded = 0;

    employees.forEach(e => {
      const activeTasks = tasks.filter(t => t.assignedTo === e.userId).length;
      const dynamicWorkload = Math.round((activeTasks / (e.capacity || 50)) * 100);
      
      if (dynamicWorkload < 40) low++;
      else if (dynamicWorkload <= 80) balanced++;
      else overloaded++;
    });

    const distribution = { low, balanced, overloaded };

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
