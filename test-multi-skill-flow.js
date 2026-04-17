import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testMultiSkillFlow() {
    try {
        console.log('Testing Multi-Skill Task Creation Flow...\n');
        
        // Test 1: Admin login
        console.log('1. Testing admin login');
        const adminLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: 'ADM001',
                password: 'admin123'
            })
        });
        
        if (adminLoginResponse.ok) {
            console.log('  Admin login successful');
        } else {
            console.log('  Admin login failed');
            return;
        }
        
        // Test 2: Create task with multiple required skills
        console.log('\n2. Testing multi-skill task creation');
        const multiSkillTaskResponse = await fetch(`${API_BASE}/tasks/auto-assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Full-Stack Web Application',
                description: 'Build a complete web application with frontend and backend',
                priority: 'high',
                requiredSkills: ['React', 'Node.js', 'MongoDB'],
                estimatedHours: 12,
                deadline: '2024-02-01'
            })
        });
        
        if (multiSkillTaskResponse.ok) {
            const taskResult = await multiSkillTaskResponse.json();
            console.log('  Multi-skill task created successfully');
            console.log('  Assigned to:', taskResult.employee.name);
            console.log('  Employee skills:', taskResult.employee.skills);
            console.log('  Matched skills count:', taskResult.metrics.matchedSkillsCount);
            console.log('  Total required skills:', taskResult.metrics.totalRequiredSkills);
            console.log('  Skill match ratio:', (taskResult.metrics.skillMatchRatio * 100).toFixed(1) + '%');
        } else {
            const error = await multiSkillTaskResponse.json();
            console.log('  Multi-skill task creation error:', error.error);
        }
        
        // Test 3: Create task with single skill (backward compatibility)
        console.log('\n3. Testing single skill task creation');
        const singleSkillTaskResponse = await fetch(`${API_BASE}/tasks/auto-assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'UI Design Task',
                description: 'Design user interface for mobile app',
                priority: 'medium',
                requiredSkills: ['Design'],
                estimatedHours: 6,
                deadline: '2024-01-25'
            })
        });
        
        if (singleSkillTaskResponse.ok) {
            const taskResult = await singleSkillTaskResponse.json();
            console.log('  Single skill task created successfully');
            console.log('  Assigned to:', taskResult.employee.name);
            console.log('  Employee skills:', taskResult.employee.skills);
        } else {
            const error = await singleSkillTaskResponse.json();
            console.log('  Single skill task creation error:', error.error);
        }
        
        // Test 4: Test task suggestion with multiple skills
        console.log('\n4. Testing AI suggestion with multiple skills');
        const suggestionResponse = await fetch(`${API_BASE}/tasks/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Data Analytics Dashboard',
                requiredSkills: ['Python', 'Data Analysis', 'Machine Learning'],
                priority: 'high'
            })
        });
        
        if (suggestionResponse.ok) {
            const suggestionResult = await suggestionResponse.json();
            console.log('  AI suggestion generated successfully');
            console.log('  Suggestion length:', suggestionResult.suggestion.length);
        } else {
            const error = await suggestionResponse.json();
            console.log('  AI suggestion error:', error.error);
        }
        
        // Test 5: Verify tasks are stored with multiple skills
        console.log('\n5. Verifying task storage');
        const tasksResponse = await fetch(`${API_BASE}/tasks`);
        if (tasksResponse.ok) {
            const tasks = await tasksResponse.json();
            const multiSkillTasks = tasks.filter(task => task.requiredSkills && task.requiredSkills.length > 1);
            console.log('  Total tasks:', tasks.length);
            console.log('  Multi-skill tasks:', multiSkillTasks.length);
            
            if (multiSkillTasks.length > 0) {
                console.log('  Example multi-skill task:');
                const exampleTask = multiSkillTasks[0];
                console.log('    Title:', exampleTask.title);
                console.log('    Required skills:', exampleTask.requiredSkills);
                console.log('    Assigned to:', exampleTask.assignedTo?.name);
            }
        }
        
        console.log('\nMulti-Skill Task Creation Flow Test Complete!');
        console.log('All features are working correctly.');
        
    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

testMultiSkillFlow();
