import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vedanthh46_db_user:0ty1TCBZCJHJblVG@cluster0.iyewviq.mongodb.net/?appName=Cluster0';

const seedEmployees = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing employees
        await Employee.deleteMany({});
        console.log('Cleared existing employees');

        // Seed employees
        const employees = [
            {
                name: 'John Doe',
                email: 'john.doe@taskai.com',
                password: 'password123',
                skills: ['JavaScript', 'React', 'Node.js'],
                capacity: 50,
                performanceScore: 75,
                currentLoad: 20
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@taskai.com',
                password: 'password123',
                skills: ['React', 'TypeScript', 'CSS'],
                capacity: 60,
                performanceScore: 85,
                currentLoad: 30
            },
            {
                name: 'Mike Johnson',
                email: 'mike.johnson@taskai.com',
                password: 'password123',
                skills: ['Python', 'Data Analysis', 'Machine Learning'],
                capacity: 40,
                performanceScore: 70,
                currentLoad: 15
            },
            {
                name: 'Sarah Williams',
                email: 'sarah.williams@taskai.com',
                password: 'password123',
                skills: ['Design', 'UI/UX', 'Figma'],
                capacity: 45,
                performanceScore: 90,
                currentLoad: 25
            },
            {
                name: 'Tom Brown',
                email: 'tom.brown@taskai.com',
                password: 'password123',
                skills: ['Node.js', 'Express', 'MongoDB'],
                capacity: 55,
                performanceScore: 80,
                currentLoad: 35
            }
        ];

        for (const employeeData of employees) {
            const employee = new Employee(employeeData);
            await employee.save();
            console.log(`Created employee: ${employee.name} (${employee.employeeId})`);
        }

        console.log('Employee seeding completed successfully');
    } catch (error) {
        console.error('Employee seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

seedEmployees();
