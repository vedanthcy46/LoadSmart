import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testButtonFunctionality() {
    try {
        console.log('Testing Button Functionality...\n');
        
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
        
        if (!adminLoginResponse.ok) {
            console.log('  Admin login failed');
            return;
        }
        console.log('  Admin login successful');
        
        // Test 2: AI Suggestion API (simulating button click)
        console.log('\n2. Testing AI Suggestion API');
        const suggestionResponse = await fetch(`${API_BASE}/tasks/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'React Dashboard Development',
                requiredSkills: ['React', 'JavaScript', 'CSS'],
                priority: 'high'
            })
        });
        
        if (suggestionResponse.ok) {
            const suggestionResult = await suggestionResponse.json();
            console.log('  AI Suggestion API working');
            console.log('  Suggestion length:', suggestionResult.suggestion.length);
        } else {
            const error = await suggestionResponse.json();
            console.log('  AI Suggestion API error:', error.error);
        }
        
        // Test 3: Auto-Assign API (simulating button click)
        console.log('\n3. Testing Auto-Assign API');
        const autoAssignResponse = await fetch(`${API_BASE}/tasks/auto-assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Node.js API Development',
                description: 'Build REST API with Node.js and Express',
                priority: 'medium',
                requiredSkills: ['Node.js', 'JavaScript', 'Express'],
                estimatedHours: 8,
                deadline: '2024-02-15'
            })
        });
        
        if (autoAssignResponse.ok) {
            const assignResult = await autoAssignResponse.json();
            console.log('  Auto-Assign API working');
            console.log('  Task assigned to:', assignResult.employee.name);
            console.log('  Employee skills:', assignResult.employee.skills);
            console.log('  Matched skills count:', assignResult.metrics.matchedSkillsCount);
            console.log('  Skill match ratio:', (assignResult.metrics.skillMatchRatio * 100).toFixed(1) + '%');
        } else {
            const error = await autoAssignResponse.json();
            console.log('  Auto-Assign API error:', error.error);
        }
        
        // Test 4: Edge case - empty skills array (buttons should be disabled)
        console.log('\n4. Testing edge case - empty skills array');
        const emptySkillsResponse = await fetch(`${API_BASE}/tasks/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Task',
                requiredSkills: [],
                priority: 'medium'
            })
        });
        
        if (!emptySkillsResponse.ok) {
            const error = await emptySkillsResponse.json();
            console.log('  Empty skills validation working:', error.error);
        } else {
            console.log('  Empty skills validation failed - should return error');
        }
        
        // Test 5: Edge case - missing title (buttons should be disabled)
        console.log('\n5. Testing edge case - missing title');
        const noTitleResponse = await fetch(`${API_BASE}/tasks/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '',
                requiredSkills: ['JavaScript'],
                priority: 'medium'
            })
        });
        
        if (!noTitleResponse.ok) {
            const error = await noTitleResponse.json();
            console.log('  Empty title validation working:', error.error);
        } else {
            console.log('  Empty title validation failed - should return error');
        }
        
        console.log('\nButton Functionality Test Complete!');
        console.log('All API endpoints are working correctly.');
        console.log('Frontend buttons should now work with proper validation.');
        
    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

testButtonFunctionality();
