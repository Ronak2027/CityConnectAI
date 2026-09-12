import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    enum: ['Garbage', 'Road', 'Drainage', 'Streetlight', 'Water Leakage', 'Illegal Dumping', 'Open Manhole', 'Public Toilet', 'Other'],
    required: true 
  },
  description: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: 'Detected Coordinates' }
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'VERIFICATION', 'RESOLVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  department: { type: String, default: 'Sanitation & Hygiene' },
  assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export const Complaint = mongoose.model('Complaint', complaintSchema);
