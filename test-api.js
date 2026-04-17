import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
    try {
        console.log('Testing Employee Management System...\n');
        
        // Test 1: Get all employees
        console.log('1. Testing GET /api/employees');
        const employeesResponse = await fetch(`${API_BASE}/employees`);
        const employees = await employeesResponse.json();
        console.log('Employees found:', employees.length);
        employees.forEach(emp => {
            console.log(`- ${emp.employeeId}: ${emp.name} (${emp.email}) - Skill: ${emp.skill}`);
        });
        
        // Test 2: Create a new employee
        console.log('\n2. Testing POST /api/employees');
        const newEmployee = {
            name: 'Test Employee',
            email: 'test.employee@taskai.com',
            password: 'test123',
            skill: 'JavaScript',
            capacity: 50
        };
        
        const createResponse = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEmployee)
        });
        
        if (createResponse.ok) {
            const createdEmployee = await createResponse.json();
            console.log('Created employee:', createdEmployee.employeeId, createdEmployee.name);
        } else {
            const error = await createResponse.json();
            console.log('Error creating employee:', error.error);
        }
        
        // Test 3: Test login with existing employee
        console.log('\n3. Testing POST /api/auth/login');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'john.doe@taskai.com',
                password: 'password123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('Login successful:', loginData.user);
        } else {
            const error = await loginResponse.json();
            console.log('Login error:', error.error);
        }
        
        // Test 4: Test admin login
        console.log('\n4. Testing admin login');
        const adminLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (adminLoginResponse.ok) {
            const adminData = await adminLoginResponse.json();
            console.log('Admin login successful:', adminData.user);
        } else {
            const error = await adminLoginResponse.json();
            console.log('Admin login error:', error.error);
        }
        
        console.log('\nAPI Testing Complete!');
        
    } catch (error) {
        console.error('API Test Error:', error.message);
    }
}

testAPI();
