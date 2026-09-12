import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'IN_PROGRESS', 'VERIFICATION', 'COMPLETED', 'REJECTED'], 
    default: 'ASSIGNED' 
  },
  priority: { type: String, default: 'Medium' },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  beforeImage: { type: String, default: '' },
  beforeGps: {
    latitude: Number,
    longitude: Number,
    timestamp: String
  },
  afterImage: { type: String, default: '' },
  afterGps: {
    latitude: Number,
    longitude: Number,
    timestamp: String
  },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

export const Task = mongoose.model('Task', taskSchema);
