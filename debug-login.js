import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function debugLogin() {
    try {
        console.log('Debugging login system...\n');
        
        // Test 1: Check if server is running
        const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('Server is running:', health.status);
        }
        
        // Test 2: Try admin login with detailed error
        console.log('\nTesting admin login...');
        const adminLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: 'ADM001',
                password: 'admin123'
            })
        });
        
        console.log('Admin login status:', adminLoginResponse.status);
        const adminResult = await adminLoginResponse.json();
        console.log('Admin login result:', adminResult);
        
        // Test 3: Try employee login with detailed error
        console.log('\nTesting employee login...');
        const employeeLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: 'EMP001',
                password: 'password123'
            })
        });
        
        console.log('Employee login status:', employeeLoginResponse.status);
        const employeeResult = await employeeLoginResponse.json();
        console.log('Employee login result:', employeeResult);
        
        // Test 4: Check what employees exist
        console.log('\nChecking existing employees...');
        const employeesResponse = await fetch(`${API_BASE}/employees`);
        if (employeesResponse.ok) {
            const employees = await employeesResponse.json();
            employees.forEach(emp => {
                console.log(`Employee: ${emp.employeeId} - ${emp.name} - ${emp.email}`);
            });
        }
        
    } catch (error) {
        console.error('Debug error:', error.message);
    }
}

debugLogin();
