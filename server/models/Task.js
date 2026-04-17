import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  requiredSkills: [{ type: String }],
  estimatedHours: { type: Number, default: 4 },
  assignedTo: { type: String }, // Storing employeeId directly as per prompt: "assignedTo (employeeId)"
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  aiExplanation: { type: String },
  deadline: { type: Date },
  completionTime: { type: Date }, // Prompt uses completionTime
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Task', taskSchema);
