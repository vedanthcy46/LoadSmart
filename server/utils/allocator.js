export const calculateAllocationScore = (employee, requiredSkills) => {
  // Check if employee has the required skills (multi-skill matching)
  const skillMatches = requiredSkills.map(requiredSkill => {
    const hasSkill = employee.skills && Array.isArray(employee.skills) && employee.skills.some(skill =>
      skill && typeof skill === 'string' && (
        skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    return hasSkill;
  });

  const matchedSkillsCount = skillMatches.filter(match => match).length;
  const totalRequiredSkills = requiredSkills.length;
  const skillMatchRatio = matchedSkillsCount / totalRequiredSkills;

  // Higher score for matching more skills
  const skillMatch = skillMatchRatio;
  const availableCapacity = Math.max(0, employee.capacity - (employee.currentLoad || 0));
  const performanceFactor = employee.performanceScore / 100;
  const workloadFactor = Math.max(0, 100 - (employee.workload || 0)) / 100;

  // Enhanced scoring formula: (skillMatch * 0.4) + (performance * 0.3) + (capacity * 0.2) + (workload * 0.1)
  const score = (skillMatch * 0.4) + (performanceFactor * 0.3) + (availableCapacity / employee.capacity * 0.2) + (workloadFactor * 0.1);

  // Find all matched skills for display
  const matchedSkills = [];
  requiredSkills.forEach(requiredSkill => {
    if (employee.skills && Array.isArray(employee.skills)) {
      const matches = employee.skills.filter(skill =>
        skill && typeof skill === 'string' && (
          skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ) || [];
      matchedSkills.push(...matches);
    }
  });

  return {
    score,
    skillMatch: skillMatchRatio > 0,
    skillMatchRatio,
    matchedSkillsCount,
    totalRequiredSkills,
    availableCapacity,
    performanceScore: employee.performanceScore,
    workload: employee.workload || 0,
    currentLoad: employee.currentLoad || 0,
    matchedSkills: [...new Set(matchedSkills)] // Remove duplicates
  };
};

export const findBestEmployee = (employees, requiredSkills) => {
  let bestEmployee = null;
  let bestScore = -1;
  let bestMetrics = null;

  for (const employee of employees) {
    if (employee.workload >= 100) continue;

    const metrics = calculateAllocationScore(employee, requiredSkills);

    if (metrics.score > bestScore) {
      bestScore = metrics.score;
      bestEmployee = employee;
      bestMetrics = metrics;
    }
  }

  return { employee: bestEmployee, metrics: bestMetrics };
};

export const getWorkloadStatus = (workload) => {
  if (workload < 40) return { status: 'low', color: 'green', label: 'Low' };
  if (workload <= 80) return { status: 'balanced', color: 'yellow', label: 'Balanced' };
  return { status: 'overloaded', color: 'red', label: 'Overloaded' };
};

export const calculateProductivityScore = (completedTasks, totalTasks) => {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
};
