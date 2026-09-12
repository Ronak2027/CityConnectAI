import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { authenticate, generateToken } from '../middleware/auth.js';
import { jsonDB } from '../services/storageAdapter.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'citizen', phone = '', department = 'General Maintenance' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      phone,
      department
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      phone: req.user.phone
    }
  });
});

// GET /api/auth/workers (Admin access)
router.get('/workers', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const workers = await User.find({ role: 'worker' }).select('-passwordHash');
      if (workers && workers.length > 0) return res.json(workers);
    }
    res.json(jsonDB.getWorkers());
  } catch (error) {
    res.json(jsonDB.getWorkers());
  }
});

export default router;

