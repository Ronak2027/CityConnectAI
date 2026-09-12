import mongoose from 'mongoose';
import { User } from '../models/User.js';

// Default Demo User ID for anonymous / public operation
const DEFAULT_USER_ID = new mongoose.Types.ObjectId('66e1bf7289f1a23c4d5e6f7a');

export const authenticate = async (req, res, next) => {
  try {
    let demoUser = null;
    if (mongoose.connection.readyState === 1) {
      demoUser = await User.findById(DEFAULT_USER_ID);
      if (!demoUser) {
        demoUser = await User.create({
          _id: DEFAULT_USER_ID,
          name: 'Public Operator',
          email: 'public.operator@cleancity.ai',
          passwordHash: 'nopassword',
          role: 'admin',
          phone: '+91 9876543210',
          department: 'Civic Maintenance'
        });
      }
    }
    req.user = demoUser || { 
      _id: DEFAULT_USER_ID, 
      name: 'Public Operator', 
      role: 'admin',
      department: 'Civic Maintenance',
      phone: '+91 9876543210'
    };
    next();
  } catch (error) {
    req.user = { 
      _id: DEFAULT_USER_ID, 
      name: 'Public Operator', 
      role: 'admin',
      department: 'Civic Maintenance',
      phone: '+91 9876543210'
    };
    next();
  }
};

// Pure pass-through authorization (Zero restriction)
export const authorize = () => {
  return (req, res, next) => next();
};

export const generateToken = () => 'open_access_token';
