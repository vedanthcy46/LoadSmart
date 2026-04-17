import crypto from 'crypto';
import mongoose from 'mongoose';
import Employee from './server/models/Employee.js';
import User from './server/models/User.js';

const MONGODB_URI = 'mongodb+srv://vedanthh46_db_user:0ty1TCBZCJHJblVG@cluster0.iyewviq.mongodb.net/?appName=Cluster0';

async function debugEmployeeLogin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check employee EMP001
        const employee = await Employee.findOne({ employeeId: 'EMP001' });
        if (employee) {
            console.log('Employee found:', employee.name);
            console.log('Stored password hash:', employee.password);
            
            // Test password hashing
            const testPassword = 'password123';
            const hashedTest = crypto.createHash('sha256').update(testPassword).digest('hex');
            console.log('Test password hash:', hashedTest);
            console.log('Passwords match:', hashedTest === employee.password);
            
            // Check if employee has comparePassword method
            console.log('Has comparePassword method:', typeof employee.comparePassword === 'function');
            
            // Try using comparePassword if available
            if (typeof employee.comparePassword === 'function') {
                const compareResult = await employee.comparePassword(testPassword);
                console.log('comparePassword result:', compareResult);
            }
        }

        // Check admin for comparison
        const admin = await User.findOne({ adminId: 'ADM001' });
        if (admin) {
            console.log('\nAdmin found:', admin.username);
            console.log('Admin has comparePassword method:', typeof admin.comparePassword === 'function');
            
            if (typeof admin.comparePassword === 'function') {
                const adminCompareResult = await admin.comparePassword('admin123');
                console.log('Admin comparePassword result:', adminCompareResult);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Debug error:', error);
    }
}

debugEmployeeLogin();
