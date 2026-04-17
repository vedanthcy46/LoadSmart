import mongoose from 'mongoose';
import crypto from 'crypto';
import Employee from './models/Employee.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://vedanthh46_db_user:0ty1TCBZCJHJblVG@ac-bud6sbm-shard-00-00.iyewviq.mongodb.net:27017,ac-bud6sbm-shard-00-01.iyewviq.mongodb.net:27017,ac-bud6sbm-shard-00-02.iyewviq.mongodb.net:27017/?ssl=true&replicaSet=atlas-y4flrf-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function fixPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    const employee = await Employee.findOne({ employeeId: 'EMP004' });
    if (employee) {
      employee.password = 'employee123';
      await employee.save();
      console.log('Successfully reset password for EMP004 to employee123');
    } else {
      console.log('Employee EMP004 not found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixPassword();
