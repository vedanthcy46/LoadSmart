import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateProductivityScore } from '../utils/allocator.js';

const router = express.Router();

const getDateFilter = (filter) => {
  const now = new Date();
  let startDate;

  switch (filter) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'monthly':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7)); // Default to weekly
  }

  return { createdAt: { $gte: startDate } };
};

// 1. Employee Analytics
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { filter } = req.query;
    const dateFilter = getDateFilter(filter);

    const employees = await User.find({ role: 'employee', ...dateFilter });
    const allEmployees = await User.find({ role: 'employee' }); // For distribution charts
    const tasks = await Task.find();

    // Skills distribution
    const skillsMap = {};
    allEmployees.forEach(emp => {
      emp.skills.forEach(skill => {
        skillsMap[skill] = (skillsMap[skill] || 0) + 1;
      });
    });
    const skillsDistribution = Object.keys(skillsMap).map(name => ({ name, count: skillsMap[name] }));

    // Capacity vs Workload
    const workloadData = allEmployees.map(emp => {
      const empTasks = tasks.filter(t => t.assignedTo === emp.userId);
      const activeTasks = empTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
      const currentLoad = activeTasks.length;
      
      const breakdown = {
        pending: empTasks.filter(t => t.status === 'Pending').length,
        inProgress: empTasks.filter(t => t.status === 'In Progress').length,
        completed: empTasks.filter(t => t.status === 'Completed').length
      };

      return {
        name: emp.name,
        capacity: emp.capacity || 50,
        workload: Math.round((currentLoad / (emp.capacity || 50)) * 100),
        breakdown
      };
    });

    res.json({
      totalEmployees: employees.length,
      employees: employees.map(e => {
        const empTasks = tasks.filter(t => t.assignedTo === e.userId);
        return {
          userId: e.userId,
          name: e.name,
          email: e.email,
          skills: e.skills,
          capacity: e.capacity,
          workload: e.workload,
          stressLevel: e.stressLevel,
          taskBreakdown: {
            pending: empTasks.filter(t => t.status === 'Pending').length,
            inProgress: empTasks.filter(t => t.status === 'In Progress').length,
            completed: empTasks.filter(t => t.status === 'Completed').length
          }
        };
      }),
      skillsDistribution,
      workloadData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Task Analytics
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { filter } = req.query;
    const dateFilter = getDateFilter(filter);

    const tasks = await Task.find(dateFilter);
    const allTasks = await Task.find();

    const statusBreakdown = {
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length
    };

    const priorityDistribution = [
      { name: 'High', value: tasks.filter(t => t.priority === 'High').length },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length },
      { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length }
    ];

    // Task trends (group by day)
    const trends = {};
    tasks.forEach(task => {
      const date = task.createdAt.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });
    const taskTrends = Object.keys(trends).sort().map(date => ({ date, count: trends[date] }));

    res.json({
      totalTasks: tasks.length,
      statusBreakdown,
      priorityDistribution,
      taskTrends,
      tasks: tasks.map(t => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedTo,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Productivity Analytics
router.get('/productivity', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { filter } = req.query;
    const dateFilter = getDateFilter(filter);

    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find(dateFilter);

    const productivityData = employees.map(emp => {
      const empTasks = tasks.filter(t => t.assignedTo === emp.userId);
      const completed = empTasks.filter(t => t.status === 'Completed').length;
      const score = calculateProductivityScore(completed, empTasks.length);
      return {
        userId: emp.userId,
        name: emp.name,
        score,
        completedTasks: completed,
        totalTasks: empTasks.length
      };
    }).sort((a, b) => b.score - a.score);

    // Productivity trend over time
    const trends = {};
    tasks.filter(t => t.status === 'Completed').forEach(task => {
      const date = task.createdAt.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });
    const productivityTrends = Object.keys(trends).sort().map(date => ({ date, score: trends[date] }));

    res.json({
      productivityData,
      topPerformers: productivityData.slice(0, 5),
      lowPerformers: productivityData.filter(p => p.score < 40),
      productivityTrends
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Overloaded Employees Analytics
router.get('/overloaded', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const employees = await User.find({ role: 'employee' });
    const tasks = await Task.find({ status: { $in: ['Pending', 'In Progress'] } });

    const overloadedEmployees = employees.map(emp => {
      const empTasks = tasks.filter(t => t.assignedTo === emp.userId);
      const currentLoad = empTasks.length;
      const workload = Math.round((currentLoad / (emp.capacity || 50)) * 100);
      
      return {
        userId: emp.userId,
        name: emp.name,
        workload,
        capacity: emp.capacity || 50,
        currentLoad,
        stressLevel: emp.stressLevel
      };
    }).filter(e => e.workload > 80);

    res.json(overloadedEmployees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
