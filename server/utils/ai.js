import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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
   * workload (currentLoad vs capacity)
   * stress level (Avoid 4-5, prefer 1-3)
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
