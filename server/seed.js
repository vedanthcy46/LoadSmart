import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config({ path: '../.env' }); // Load env variables from root

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://vedanthh46_db_user:0ty1TCBZCJHJblVG@ac-bud6sbm-shard-00-00.iyewviq.mongodb.net:27017,ac-bud6sbm-shard-00-01.iyewviq.mongodb.net:27017,ac-bud6sbm-shard-00-02.iyewviq.mongodb.net:27017/?ssl=true&replicaSet=atlas-y4flrf-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const seedDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Drop existing users collection to clear legacy indexes
        try {
            await mongoose.connection.db.dropCollection('users');
            console.log('Dropped users collection.');
        } catch (err) {
            console.log('Users collection not found or already dropped.');
        }

        // Clear existing users just in case drop failed/was skipped
        await User.deleteMany({});
        console.log('Cleared existing users.');

        // Admin User
        const admin = new User({
            userId: 'ADM001',
            name: 'System Admin',
            password: 'admin123',
            role: 'admin',
            skills: ['Management', 'Administration'],
            capacity: 100
        });

        // Employee 1
        const emp1 = new User({
            userId: 'EMP001',
            name: 'John Doe',
            password: 'employee123',
            role: 'employee',
            skills: ['JavaScript', 'React', 'Node.js'],
            capacity: 40
        });

        // Employee 2
        const emp2 = new User({
            userId: 'EMP002',
            name: 'Jane Smith',
            password: 'employee123',
            role: 'employee',
            skills: ['Python', 'Data Analysis', 'DevOps'],
            capacity: 40
        });

        await admin.save();
        await emp1.save();
        await emp2.save();

        console.log('Successfully seeded database with:');
        console.log('- Admin (ADM001 / admin123)');
        console.log('- Employee (EMP001 / employee123)');
        console.log('- Employee (EMP002 / employee123)');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
