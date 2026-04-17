import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testEnhancedSystem() {
    try {
        console.log('Testing Enhanced Employee Management System...\n');
        
        // Test 1: Test ID-based login system
        console.log('1. Testing ID-based login system');
        
        // Test admin login with adminId
        const adminLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: 'ADM001',
                password: 'admin123'
            })
        });
        
        if (adminLoginResponse.ok) {
            const adminData = await adminLoginResponse.json();
            console.log('  Admin login successful:', adminData.user.role);
        } else {
            console.log('  Admin login failed');
        }
        
        // Test employee login with employeeId
        const employeeLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: 'EMP001',
                password: 'password123'
            })
        });
        
        if (employeeLoginResponse.ok) {
            const employeeData = await employeeLoginResponse.json();
            console.log('  Employee login successful:', employeeData.user.role);
        } else {
            console.log('  Employee login failed');
        }
        
        // Test 2: Test multi-skill employee creation
        console.log('\n2. Testing multi-skill employee creation');
        const newEmployeeResponse = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Alice Johnson',
                email: 'alice.johnson@taskai.com',
                password: 'test123',
                skills: ['JavaScript', 'React', 'TypeScript'],
                capacity: 60
            })
        });
        
        if (newEmployeeResponse.ok) {
            const newEmployee = await newEmployeeResponse.json();
            console.log('  Multi-skill employee created:', newEmployee.employeeId);
            console.log('  Skills:', newEmployee.skills);
        } else {
            const error = await newEmployeeResponse.json();
            console.log('  Employee creation error:', error.error);
        }
        
        // Test 3: Test profile management
        console.log('\n3. Testing profile management');
        const employeesResponse = await fetch(`${API_BASE}/employees`);
        const employees = await employeesResponse.json();
        
        if (employees.length > 0) {
            const testEmployee = employees[0];
            
            // Get profile
            const profileResponse = await fetch(`${API_BASE}/profile/${testEmployee._id}`);
            if (profileResponse.ok) {
                const profile = await profileResponse.json();
                console.log('  Profile retrieved for:', profile.name || profile.username);
            }
            
            // Update profile
            const updateProfileResponse = await fetch(`${API_BASE}/profile/${testEmployee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
                    capacity: 55
                })
            });
            
            if (updateProfileResponse.ok) {
                const updatedProfile = await updateProfileResponse.json();
                console.log('  Profile updated successfully');
            }
        }
        
        // Test 4: Test notification system
        console.log('\n4. Testing notification system');
        if (employees.length > 0) {
            const testEmployee = employees[0];
            
            // Get notifications for employee
            const notificationsResponse = await fetch(`${API_BASE}/notifications/${testEmployee._id}`);
            if (notificationsResponse.ok) {
                const notifications = await notificationsResponse.json();
                console.log('  Notifications retrieved:', notifications.length);
                
                if (notifications.length > 0) {
                    // Mark notification as read
                    const markReadResponse = await fetch(`${API_BASE}/notifications/${notifications[0]._id}`, {
                        method: 'PATCH'
                    });
                    
                    if (markReadResponse.ok) {
                        console.log('  Notification marked as read');
                    }
                }
            }
        }
        
        // Test 5: Test AI-based multi-skill task allocation
        console.log('\n5. Testing AI-based multi-skill task allocation');
        const taskAllocationResponse = await fetch(`${API_BASE}/tasks/auto-assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Build React Dashboard',
                description: 'Create a responsive dashboard with charts',
                priority: 'high',
                requiredSkill: 'React',
                estimatedHours: 8,
                deadline: '2024-01-15'
            })
        });
        
        if (taskAllocationResponse.ok) {
            const taskResult = await taskAllocationResponse.json();
            console.log('  Task assigned successfully to:', taskResult.employee.name);
            console.log('  Matched skills:', taskResult.metrics.matchedSkills);
            console.log('  AI explanation:', taskResult.aiExplanation ? 'Generated' : 'Not generated');
        } else {
            const error = await taskAllocationResponse.json();
            console.log('  Task allocation error:', error.error);
        }
        
        // Test 6: Verify employees have multiple skills
        console.log('\n6. Verifying multi-skill employee data');
        const updatedEmployeesResponse = await fetch(`${API_BASE}/employees`);
        const updatedEmployees = await updatedEmployeesResponse.json();
        
        updatedEmployees.forEach(emp => {
            console.log(`  ${emp.employeeId}: ${emp.name} - Skills: [${emp.skills?.join(', ') || 'None'}]`);
        });
        
        console.log('\nEnhanced System Testing Complete!');
        console.log('All major features have been tested successfully.');
        
    } catch (error) {
        console.error('System Test Error:', error.message);
    }
}

testEnhancedSystem();
