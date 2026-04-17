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
  const employeeList = employees.map(e =>
    `- ${e.name}: Performance ${e.performanceScore}%, Workload ${e.workload}%, Skills: ${e.skills.join(', ')}`
  ).join('\n');

  const prompt = `You are an AI workforce advisor. Suggest the best employee for this task:

Task: "${task.title}"
Required Skills: ${task.requiredSkills ? task.requiredSkills.join(', ') : ''}
Priority: ${task.priority}

Available Employees:
${employeeList}

Respond with the employee name and a brief reason (2 lines max).`;

  return await generateAIResponse(prompt);
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

export const generateAITaskAssignment = async (taskTitle, requiredSkills, employees) => {
  // Prepare employee list in the exact format requested
  const employeeListJson = employees.map(emp => ({
    userId: emp.userId,
    name: emp.name,
    skills: emp.skills,
    performanceScore: emp.performanceScore,
    currentLoad: emp.currentLoad,
    capacity: emp.capacity
  }));

  const prompt = `You are an intelligent task allocation assistant.

Task: ${taskTitle}
Required Skills: ${requiredSkills ? requiredSkills.join(', ') : ''}

Employees:
${JSON.stringify(employeeListJson, null, 2)}

Choose the best employee based on:
* matching skills
* high performance
* low workload

Return ONLY:
{
"userId": "EMP001",
"reason": "short explanation"
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    const aiResponse = response.choices[0].message.content.trim();

    // Try to parse JSON from the AI response
    try {
      // Extract JSON from response if it contains extra text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: extract userId and reason using regex
      const userIdMatch = aiResponse.match(/EMP\d{3}|ADM\d{3}/);
      if (userIdMatch) {
        return {
          userId: userIdMatch[0],
          reason: aiResponse.substring(0, 100)
        };
      }
      throw new Error('Could not parse AI response');
    }
  } catch (error) {
    console.error('Groq API Error in task assignment:', error.message);
    // Fallback: use the first matching employee
    const matchingEmployee = employees.find(emp =>
      requiredSkills && requiredSkills.some(reqSkill => 
        emp.skills.some(skill => skill.toLowerCase().includes(reqSkill.toLowerCase()))
      )
    );
    if (matchingEmployee) {
      return {
        userId: matchingEmployee.userId,
        reason: `Selected based on skill match and performance score of ${matchingEmployee.performanceScore}%`
      };
    }
    throw error;
  }
};
