import Task from '../models/Task.js';
import User from '../models/User.js';

// Helper to recalculate employee workload and status
export const refreshWorkload = async (userId) => {
  if (!userId) return;
  try {
    const user = await User.findOne({ userId });
    if (!user) return;

    const activeTasks = await Task.find({ 
      assignedTo: userId, 
      status: { $in: ['Pending', 'In Progress', 'Under Review'] } 
    });

    // Correct Formula: workload = (totalAssignedTaskHours / capacity) * 100
    const totalHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const capacity = user.capacity || 6; // Default to 6 as per new rules
    
    const calculatedWorkload = Math.round((totalHours / capacity) * 100);
    user.workload = calculatedWorkload;
    user.currentLoad = activeTasks.length; 
    user.currentLoadHours = totalHours;

    // Workload Status:
    // < 50% -> "available" (Low)
    // 50–80% -> "balanced"
    // > 80% -> "overloaded"
    if (user.workload > 80) user.status = 'overloaded';
    else if (user.workload >= 50) user.status = 'balanced';
    else user.status = 'available';

    await user.save();
    console.log(`[Workload Sync] Updated ${userId}: ${user.workload}% (Hours: ${totalHours}, Capacity: ${capacity})`);
    return user;
  } catch (err) {
    console.error(`[Workload Sync] Failed for ${userId}:`, err);
  }
};
