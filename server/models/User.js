import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'employee'], 
    default: 'employee' 
  },
  skills: [{ type: String }],
  performanceScore: { type: Number, default: 50 },
  capacity: { type: Number, required: true, min: 1, max: 100, default: 8 },
  currentLoad: { type: Number, default: 0 },
  currentLoadHours: { type: Number, default: 0 },
  workload: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  stressLevel: { type: Number, default: 1, min: 1, max: 5 },
  stressNote: { type: String, default: '' },
  stressCategory: { type: String, default: '' },
  stressAIAnalysis: { type: String, default: '' },
  status: {
    type: String,
    enum: ['available', 'busy', 'balanced', 'overloaded'],
    default: 'available'
  },
  badges: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = crypto.createHash('sha256').update(this.password).digest('hex');
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  const hashed = crypto.createHash('sha256').update(candidatePassword).digest('hex');
  return hashed === this.password;
};

export default mongoose.model('User', userSchema);
