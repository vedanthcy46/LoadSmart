import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  message: { type: String, required: true },
  stressLevel: { type: Number, required: true, min: 1, max: 5 },
  aiTips: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Feedback', feedbackSchema);
