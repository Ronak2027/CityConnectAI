import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'worker', 'admin'], 
    default: 'citizen' 
  },
  department: { type: String, default: 'General Maintenance' },
  avatar: { type: String, default: '' },
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
