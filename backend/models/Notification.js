import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['citizen', 'worker', 'admin'], required: true },
  type: { type: String, default: 'INFO' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
