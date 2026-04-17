import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testLiveState() {
    try {
        console.log('Testing Live State Issues...\n');
        
        // Test if the server is running and accessible
        const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`);
        if (!healthResponse.ok) {
            console.log('Server is not running or not accessible');
            return;
        }
        console.log('Server is running');
        
        // Test the actual API endpoints that the buttons would call
        console.log('\nTesting API endpoints that buttons use:');
        
        // Test 1: Check if we can get employees (needed for skill suggestions)
        const employeesResponse = await fetch(`${API_BASE}/employees`);
        if (employeesResponse.ok) {
            const employees = await employeesResponse.json();
            console.log(`1. Employees API working: ${employees.length} employees found`);
            
            // Show available skills from employees
            const allSkills = new Set();
            employees.forEach(emp => {
                if (emp.skills && Array.isArray(emp.skills)) {
                    emp.skills.forEach(skill => allSkills.add(skill));
                }
            });
            console.log(`   Available skills: [${Array.from(allSkills).join(', ')}]`);
        } else {
            console.log('1. Employees API failed');
        }
        
        // Test 2: Check if we can create a task with the expected format
        console.log('\n2. Testing task creation with multi-skill format:');
        const testTask = {
            title: 'Test Multi-Skill Task',
            description: 'Testing the button functionality',
            priority: 'medium',
            requiredSkills: ['JavaScript', 'React'],
            estimatedHours: 4
        };
        
        console.log(`   Task data: ${JSON.stringify(testTask, null, 2)}`);
        
        // Test 3: Try the suggestion API
        console.log('\n3. Testing suggestion API:');
        try {
            const suggestionResponse = await fetch(`${API_BASE}/tasks/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testTask)
            });
            
            if (suggestionResponse.ok) {
                const suggestion = await suggestionResponse.json();
                console.log('   Suggestion API working');
                console.log(`   Suggestion length: ${suggestion.suggestion.length}`);
            } else {
                const error = await suggestionResponse.json();
                console.log(`   Suggestion API error: ${error.error}`);
            }
        } catch (error) {
            console.log(`   Suggestion API exception: ${error.message}`);
        }
        
        console.log('\n=== Possible Issues ===');
        console.log('If buttons are still disabled, check:');
        console.log('1. Frontend state not updating properly');
        console.log('2. Skill input component not calling addSkill function');
        console.log('3. RequiredSkills array not being populated');
        console.log('4. Form validation logic not working correctly');
        
        console.log('\n=== Manual Testing Steps ===');
        console.log('1. Enter a title in the task title field');
        console.log('2. Type a skill in the skills input field');
        console.log('3. Press Enter or click on a suggestion');
        console.log('4. Check if the skill appears as a tag');
        console.log('5. Verify buttons become enabled');
        
    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

testLiveState();
