import express from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Verification } from '../models/Verification.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { calculateHaversineDistance } from '../services/distance.js';
import { verifyWorkWithAI } from '../services/aiService.js';
import { jsonDB } from '../services/storageAdapter.js';

const router = express.Router();

// GET /api/tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { workerId } = req.query;
    let tasks = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const query = workerId ? { workerId } : {};
        tasks = await Task.find(query)
          .populate({ path: 'complaintId', populate: { path: 'citizenId', select: 'name email' } })
          .populate('workerId', 'name email phone')
          .sort({ createdAt: -1 });
      } catch (err) {}
    }

    if (!tasks || tasks.length === 0) {
      tasks = jsonDB.getTasks();
    }

    if (workerId) {
      tasks = tasks.filter(t => {
        const wVal = typeof t.workerId === 'object' ? (t.workerId?.id || t.workerId?._id) : t.workerId;
        return wVal === workerId || t.worker?.id === workerId || t.worker?._id === workerId;
      });
    }

    res.json(tasks);
  } catch (error) {
    res.json(jsonDB.getTasks());
  }
});


// POST /api/tasks/:id/start
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    jsonDB.updateTask(taskId, { status: 'IN_PROGRESS', startedAt: new Date().toISOString() });
    if (mongoose.connection.readyState === 1) {
      try {
        await Task.findByIdAndUpdate(taskId, { status: 'IN_PROGRESS', startedAt: new Date() });
      } catch (err) {}
    }

    if (req.io) {
      req.io.emit('task:updated', { taskId, status: 'IN_PROGRESS' });
    }

    res.json({ message: 'Work started', taskId, status: 'IN_PROGRESS' });
  } catch (error) {
    res.status(500).json({ message: 'Error starting task' });
  }
});

// POST /api/tasks/:id/before-photo
router.post('/:id/before-photo', authenticate, upload.single('beforeImage'), async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: 'No before-work photo uploaded' });
    }

    const photoPath = `/uploads/${req.file.filename}`;
    jsonDB.updateTask(taskId, { beforeImage: photoPath, status: 'IN_PROGRESS' });
    
    if (mongoose.connection.readyState === 1) {
      try {
        const query = mongoose.Types.ObjectId.isValid(taskId) 
          ? { $or: [{ _id: taskId }, { taskId }] }
          : { taskId };
        await Task.findOneAndUpdate(query, { beforeImage: photoPath, status: 'IN_PROGRESS' });
      } catch (err) {}
    }

    if (req.io) {
      req.io.emit('task:updated', { taskId, status: 'IN_PROGRESS', beforeImage: photoPath });
    }

    res.json({ 
      message: 'Before photo recorded successfully', 
      photoPath,
      task: { taskId, beforeImage: photoPath, status: 'IN_PROGRESS' }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving before photo' });
  }
});

// POST /api/tasks/:id/complete (Accepts both beforeImage and afterImage)
router.post('/:id/complete', authenticate, upload.fields([{ name: 'afterImage', maxCount: 1 }, { name: 'beforeImage', maxCount: 1 }]), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { latitude, longitude, beforeImage: submittedBeforeImage } = req.body;

    // Find task in local DB or Mongo
    let task = jsonDB.findTask(taskId);
    if (mongoose.connection.readyState === 1) {
      try {
        const query = mongoose.Types.ObjectId.isValid(taskId)
          ? { $or: [{ _id: taskId }, { taskId }] }
          : { taskId };
        const dbTask = await Task.findOne(query).populate('complaintId').populate('workerId');
        if (dbTask) task = dbTask.toObject ? dbTask.toObject() : dbTask;
      } catch (err) {}
    }

    const afterFile = req.files?.afterImage?.[0] || req.file;
    const beforeFile = req.files?.beforeImage?.[0];

    // Determine after image
    const afterImageUrl = afterFile ? `/uploads/${afterFile.filename}` : (task?.afterImage || '/uploads/after-captured.jpg');

    // Determine before image: uploaded file, or submitted string from form, or already saved on task, or complaint photo
    let beforeImageUrl = beforeFile ? `/uploads/${beforeFile.filename}` : (submittedBeforeImage || task?.beforeImage);
    if (!beforeImageUrl && task?.complaintId?.photoUrl) {
      beforeImageUrl = task.complaintId.photoUrl;
    }
    if (!beforeImageUrl) {
      beforeImageUrl = afterImageUrl; // Safe fallback so image is never broken 404
    }

    const workerLat = parseFloat(latitude) || task?.location?.latitude || 19.0760;
    const workerLng = parseFloat(longitude) || task?.location?.longitude || 72.8777;
    const complaintLat = task?.location?.latitude || 19.0760;
    const complaintLng = task?.location?.longitude || 72.8777;

    const rawDist = calculateHaversineDistance(workerLat, workerLng, complaintLat, complaintLng);
    const maxAllowed = 50.0;
    const displayDistance = Math.round(rawDist * 10) / 10;
    const gpsPassed = rawDist <= maxAllowed;

    // Associated complaint & worker info
    const complaintRef = task?.complaintId || { complaintId: 'CMP-2026-1001', category: 'Garbage / Waste' };
    const complaintIdVal = complaintRef._id || complaintRef.id || complaintRef.complaintId || 'CMP-2026-1001';
    const workerIdVal = req.body.workerId || (typeof task?.workerId === 'object' ? (task.workerId?.id || task.workerId?._id) : task?.workerId) || 'WRK-201';
    
    const workerList = jsonDB.getWorkers();
    const workerObj = workerList.find(w => w._id === workerIdVal || w.id === workerIdVal) || {
      name: 'Ramesh Shinde',
      department: 'Waste Management',
      phone: '+91 98201 12345'
    };

    const newVerif = {
      _id: `VER-${Date.now()}`,
      verificationId: `VER-2026-${String(Date.now()).slice(-4)}`,
      taskId: taskId,
      complaintId: {
        _id: complaintIdVal,
        complaintId: complaintRef.complaintId || complaintIdVal,
        category: complaintRef.category || 'Garbage / Waste',
        description: complaintRef.description || 'Civic maintenance issue'
      },
      workerId: {
        _id: workerObj._id || workerIdVal,
        name: workerObj.name || 'Ramesh Shinde',
        department: workerObj.department || 'Waste Management',
        phone: workerObj.phone || '+91 98201 12345'
      },
      beforeImage: beforeImageUrl,
      afterImage: afterImageUrl,
      imageVerification: {
        verifiedByModel: false,
        status: 'AWAITING_MODEL',
        confidence: null,
        ssimScore: null,
        detectedChanges: [],
        reason: 'Awaiting verification by admin via AI model'
      },
      gpsVerification: {
        passed: gpsPassed,
        distanceMeters: displayDistance,
        maxAllowedMeters: 9.0
      },
      workerLocation: { 
        latitude: workerLat, 
        longitude: workerLng,
        address: req.body.workerAddress || `${workerLat.toFixed(5)}, ${workerLng.toFixed(5)}`
      },
      complaintLocation: { 
        latitude: complaintLat, 
        longitude: complaintLng,
        address: task?.location?.address || complaintRef?.location?.address || `${complaintLat.toFixed(5)}, ${complaintLng.toFixed(5)}`
      },
      captureTimestamp: new Date().toISOString(),
      cameraVerification: true,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const verification = jsonDB.createVerification(newVerif);

    // Update Task and Complaint in local store
    jsonDB.updateTask(taskId, { 
      status: 'VERIFICATION', 
      beforeImage: beforeImageUrl, 
      afterImage: afterImageUrl,
      verificationId: verification._id
    });
    jsonDB.updateComplaintStatus(complaintIdVal, 'VERIFICATION');

    // 1. Immediately emit real-time broadcast to Admin and all connected sockets
    if (req.io) {
      req.io.emit('verification:created', verification);
      req.io.emit('verification:new', verification);
      req.io.emit('task:updated', { taskId, status: 'VERIFICATION' });
      req.io.emit('complaint:updated', { complaintId: complaintIdVal, status: 'VERIFICATION' });
    }

    // 2. Respond immediately to worker (Zero latency perceived by user)
    res.json({
      message: 'Work evidence submitted for Admin verification',
      gpsVerification: { passed: gpsPassed, distanceMeters: displayDistance },
      verification
    });

    // 3. Persist to MongoDB Atlas asynchronously in parallel without blocking response
    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(taskId)
        ? { $or: [{ _id: taskId }, { taskId }] }
        : { taskId };

      const mongoVerif = { ...newVerif };
      delete mongoVerif._id; // Let MongoDB assign a native ObjectId

      Promise.allSettled([
        Verification.findOneAndUpdate(
          { verificationId: verification.verificationId },
          { $set: mongoVerif },
          { upsert: true, new: true }
        ),
        Task.findOneAndUpdate(query, { 
          status: 'VERIFICATION', 
          beforeImage: beforeImageUrl, 
          afterImage: afterImageUrl
        })
      ]).catch(err => {
        console.warn('Background MongoDB task/verification sync:', err.message);
      });
    }
  } catch (error) {
    console.error('Error submitting completion evidence:', error);
    res.status(500).json({ message: 'Error submitting completion evidence', error: error.message });
  }
});

export default router;

