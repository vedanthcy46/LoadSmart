import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export const generateAIResponse = async (prompt) => {
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.message);
    return 'AI explanation unavailable. Please check Groq API configuration.';
  }
};

export const generateTaskAllocationExplanation = async (employee, task, metrics) => {
  const prompt = `You are an AI assistant for workforce management. Explain why ${employee.name} is the best choice for the task "${task.title}".

Employee metrics:
- Performance Score: ${metrics.performanceScore}/100
- Current Workload: ${metrics.workload}%
- Skill Match: ${metrics.skillMatch ? 'Yes' : 'No'}
- Available Capacity: ${100 - metrics.workload}%

Provide a concise 2-3 line explanation focusing on performance, workload, and skill match.`;

  return await generateAIResponse(prompt);
};

export const generateManagerSuggestion = async (task, employees) => {
  const result = await generateAITaskAssignment(
    task.title,
    task.description,
    task.requiredSkills,
    task.estimatedHours,
    employees
  );

  const suggestion = result.assignments.map(a => 
    `${a.employeeId} (${a.assignedSkill}): ${a.hours} hrs - ${a.reason}`
  ).join('\n');

  return `Suggested Distribution:\n${suggestion}`;
};

export const analyzeStressLevel = async (stressNote, stressLevel) => {
  const prompt = `You are an AI wellness advisor. Analyze this employee's stress input:

Stress Level (1-5): ${stressLevel}
Note: "${stressNote}"

Provide:
1. Stress category (Low/Medium/High)
2. A brief supportive suggestion (1-2 lines)`;

  return await generateAIResponse(prompt);
};

export const generateProductivityInsights = async (teamStats) => {
  const prompt = `You are an AI productivity analyst. Analyze these team statistics:

- Total Employees: ${teamStats.totalEmployees}
- Total Tasks: ${teamStats.totalTasks}
- Completed Tasks: ${teamStats.completedTasks}
- Average Productivity: ${teamStats.avgProductivity}%
- Overloaded Employees: ${teamStats.overloadedCount}

Provide 2-3 key insights about team productivity and workload distribution.`;

  return await generateAIResponse(prompt);
};

export const generateAITaskAssignment = async (taskTitle, description, requiredSkills, estimatedHours, employees) => {
  // Prepare employee list with stressLevel and other metrics
  const employeeListJson = employees.map(emp => ({
    userId: emp.userId,
    name: emp.name,
    skills: emp.skills,
    performanceScore: emp.performanceScore,
    currentLoad: emp.currentLoad,
    capacity: emp.capacity,
    stressLevel: emp.stressLevel || 1
  }));

  const prompt = `You are an intelligent workforce manager.

Task:
* Title: ${taskTitle}
* Description: ${description}
* Required Skills: ${requiredSkills ? requiredSkills.join(', ') : ''}
* Total Estimated Hours: ${estimatedHours}

Employees:
${JSON.stringify(employeeListJson, null, 2)}

Analyze and:
1. Split the task based on required skills if it makes sense (e.g., frontend work vs styling vs backend).
2. Distribute work fairly among employees based on:
   * skill match
   * workload (ONLY assign if workload < 80%)
   * stress level (ONLY assign if stress level <= 3)
3. Ensure the total hours assigned across all employees equals ${estimatedHours}.

Return ONLY structured JSON in this format:
{
  "assignments": [
    {
      "employeeId": "EMP001",
      "assignedSkill": "react",
      "hours": 3,
      "reason": "short explanation"
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 800
    });

    const aiResponse = response.choices[0].message.content.trim();

    // Try to parse JSON from the AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.assignments && Array.isArray(parsed.assignments)) {
          return parsed;
        }
      }
      throw new Error('Invalid AI response structure');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: assign entire task to one person
      const sorted = [...employees].sort((a, b) => (a.currentLoad / a.capacity) - (b.currentLoad / b.capacity));
      return {
        assignments: [{
          employeeId: sorted[0].userId,
          assignedSkill: requiredSkills[0] || 'general',
          hours: estimatedHours,
          reason: "Fallback assignment due to AI parsing error."
        }]
      };
    }
  } catch (error) {
    console.error('Groq API Error in task assignment:', error.message);
    throw error;
  }
};
export const generateEmployeeTips = async (feedback, stressLevel) => {
  const prompt = `You are a workplace productivity assistant.

Employee Feedback:
"${feedback}"

Stress Level:
${stressLevel}

Your goal is to provide supportive, motivational, and actionable advice to help this employee stay focused and productive while managing their reported stress level.

Give:
* 2–3 short actionable tips
* Focus on task completion, time management, and maintaining high performance.

Return ONLY structured JSON in this format:
{
  "tips": ["tip1", "tip2", "tip3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    const aiResponse = response.choices[0].message.content.trim();
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.tips || [];
    }
    return ["Take a short break to clear your mind.", "Focus on one high-priority task at a time."];
  } catch (error) {
    console.error('Groq API Error in employee tips:', error.message);
    return ["Take a short break to clear your mind.", "Focus on one high-priority task at a time."];
  }
};

export const generateAIReassignment = async (tasks, employees) => {
  const employeeListJson = employees.map(emp => ({
    userId: emp.userId,
    name: emp.name,
    skills: emp.skills,
    performanceScore: emp.performanceScore,
    currentLoad: emp.currentLoad,
    workload: emp.workload,
    stressLevel: emp.stressLevel || 1
  }));

  const tasksJson = tasks.map(t => ({
    id: t._id,
    title: t.title,
    requiredSkills: t.requiredSkills,
    estimatedHours: t.estimatedHours
  }));

  const prompt = `You are an expert AI workforce optimizer. 
Your goal is to REASSIGN tasks from an overloaded employee to the most suitable alternative employees.

Tasks to reassign:
${JSON.stringify(tasksJson, null, 2)}

Available Employees (excluding the overloaded one):
${JSON.stringify(employeeListJson, null, 2)}

Criteria:
1. Skill Match: Highest priority.
2. Workload: Prefer employees with lower workload (under 60%).
3. Stress Level: Prefer employees with stress level 1-2.
4. Performance: Prefer employees with higher performance scores for complex tasks.

Return ONLY structured JSON in this format:
{
  "reassignments": [
    {
      "taskId": "task_mongodb_id",
      "newEmployeeId": "userId",
      "reason": "short explanation"
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content.trim();
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).reassignments || [];
    }
    return [];
  } catch (error) {
    console.error('Groq API Error in reassignment:', error.message);
    return [];
  }
};

export const generateWorkloadSuggestion = async (metrics) => {
  const prompt = `You are a workforce optimization AI.

Employee Data:
* Productivity Score: ${metrics.productivityScore}
* Workload: ${metrics.workload}%
* Stress Level: ${metrics.stressLevel}
* Completed Tasks: ${metrics.completedTasks}
* Pending Tasks: ${metrics.pendingTasks}

Decide:
1. Should workload increase, decrease, or stay same?
2. Suggest new capacity (in hours)
3. Give short reason

Return ONLY structured JSON in this format:
{
  "suggestion": "increase_load" | "decrease_load" | "maintain",
  "recommendedCapacity": number,
  "reason": "..."
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 300
    });

    const aiResponse = response.choices[0].message.content.trim();
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { suggestion: "maintain", recommendedCapacity: 8, reason: "Unable to parse AI suggestion." };
  } catch (error) {
    console.error('Groq API Error in workload suggestion:', error.message);
    return { suggestion: "maintain", recommendedCapacity: 8, reason: "AI service unavailable." };
  }
};
