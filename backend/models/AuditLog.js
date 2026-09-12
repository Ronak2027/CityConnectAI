import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  targetId: { type: String, default: '' },
  details: { type: String, default: '' }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
