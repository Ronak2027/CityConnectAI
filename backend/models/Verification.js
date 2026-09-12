import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  verificationId: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.Mixed, ref: 'Task' },
  complaintId: { type: mongoose.Schema.Types.Mixed, ref: 'Complaint' },
  workerId: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  beforeImage: { type: String, required: true },
  afterImage: { type: String, required: true },
  imageVerification: {
    verifiedByModel: { type: Boolean, default: false },
    status: { type: String, default: 'AWAITING_MODEL' },
    confidence: { type: Number, default: null },
    ssimScore: { type: Number, default: null },
    detectedChanges: { type: Array, default: [] },
    reason: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    aiModelUsed: { type: String, default: 'CityConnectAI YOLOv8 Engine' }
  },
  gpsVerification: {
    passed: { type: Boolean, required: true },
    distanceMeters: { type: Number, required: true },
    maxAllowedMeters: { type: Number, default: 9.0 }
  },
  workerLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  complaintLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  captureTimestamp: { type: String, required: true },
  cameraVerification: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminDecisionAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

export const Verification = mongoose.model('Verification', verificationSchema);
