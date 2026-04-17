import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://vedanthh46_db_user:0ty1TCBZCJHJblVG@ac-bud6sbm-shard-00-00.iyewviq.mongodb.net:27017,ac-bud6sbm-shard-00-01.iyewviq.mongodb.net:27017,ac-bud6sbm-shard-00-02.iyewviq.mongodb.net:27017/?ssl=true&replicaSet=atlas-y4flrf-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

// MongoDB connection with enhanced error handling and fallback
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);

    // If it's a DNS error, provide helpful information
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error('\n⚠️  MongoDB Atlas DNS Resolution Failed');
      console.error('Solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Try using mobile hotspot instead of WiFi');
      console.error('3. Temporarily disable firewall/antivirus');
      console.error('4. Update your network drivers');
      console.error('5. Install MongoDB locally (see SETUP_MONGODB.md)');
      console.error('\nServer will continue retrying...\n');
    }

    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

import usersRouter from './routes/users.js';
import tasksRouter from './routes/tasks.js';
import notificationsRouter from './routes/notifications.js';
import dashboardRouter from './routes/dashboard.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import skillsRouter from './routes/skills.js';
import feedbackRouter from './routes/feedback.js';
import Skill from './models/Skill.js';
import User from './models/User.js';

// Seed default skills and admin
const seedDB = async () => {
  try {
    // Seed skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      const defaultSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Design', 'Testing', 'DevOps', 'Data Analysis'];
      const skillsToInsert = defaultSkills.map(name => ({ name }));
      await Skill.insertMany(skillsToInsert);
      console.log('Seeded default skills.');
    }

    // Seed admin if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const admin = new User({
        userId: 'ADM001',
        name: 'System Admin',
        password: 'admin123',
        role: 'admin',
        skills: ['Management'],
        capacity: 100
      });
      await admin.save();
      console.log('Seeded default admin (ADM001 / admin123).');
    }
  } catch (error) {
    console.error('Failed to seed database:', error.message);
  }
};

mongoose.connection.once('open', seedDB);

app.use('/api/users', usersRouter);
app.use('/api/employees', usersRouter); // Maintain alias for frontend compatibility for now
app.use('/api/tasks', tasksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ai', aiRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/feedback', feedbackRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
