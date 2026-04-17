import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vedanthh46_db_user:0ty1TCBZCJHJblVG@cluster0.iyewviq.mongodb.net/?appName=Cluster0';

const seedUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Seed users
        const users = [
            {
                username: 'admin',
                email: 'admin@taskai.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                username: 'john_doe',
                email: 'john.doe@taskai.com',
                password: 'password123',
                role: 'employee'
            },
            {
                username: 'jane_smith',
                email: 'jane.smith@taskai.com',
                password: 'password123',
                role: 'employee'
            }
        ];

        for (const userData of users) {
            const user = new User(userData);
            await user.save();
            console.log(`Created user: ${user.username} (${user.role})`);
        }

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

seedUsers();