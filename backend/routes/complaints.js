import express from 'express';
import { Complaint } from '../models/Complaint.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { jsonDB } from '../services/storageAdapter.js';

const router = express.Router();

function getCategoryMeta(category) {
  switch (category) {
    case 'Garbage':
    case 'Illegal Dumping':
      return { priority: 'High', department: 'Sanitation & Solid Waste' };
    case 'Open Manhole':
    case 'Water Leakage':
      return { priority: 'Critical', department: 'Water Supply & Drainage' };
    case 'Drainage':
      return { priority: 'High', department: 'Water Supply & Drainage' };
    case 'Streetlight':
      return { priority: 'Medium', department: 'Electrical Operations' };
    case 'Road':
      return { priority: 'Medium', department: 'Roads & Infrastructure' };
    case 'Public Toilet':
      return { priority: 'Low', department: 'Public Hygiene' };
    default:
      return { priority: 'Medium', department: 'General Maintenance' };
  }
}

// POST /api/complaints
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { category, description = '', latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Location permission is required to submit a complaint. Latitude and Longitude are mandatory.' 
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'Invalid GPS coordinates provided.' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';
    if (!photoUrl && (!description || description.trim().length === 0)) {
      return res.status(400).json({ 
        message: 'A detailed description is required when no photo is attached.' 
      });
    }

    if (!category) {
      return res.status(400).json({ message: 'Category is required.' });
    }

    const complaintId = `CMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const { priority, department } = getCategoryMeta(category);

    const complaintData = {
      _id: complaintId,
      complaintId,
      citizenId: req.user._id,
      category,
      description: description.trim(),
      photoUrl,
      location: {
        latitude: lat,
        longitude: lng,
        address: (address && !address.startsWith('Lat:')) ? address.trim() : `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      },
      priority,
      department,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    let complaint;
    try {
      complaint = await Complaint.create(complaintData);
    } catch (dbErr) {
      // JSON Storage fallback
      complaint = jsonDB.createComplaint(complaintData);
    }

    if (req.io) {
      req.io.emit('complaint.created', complaint);
    }

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error: error.message });
  }
});

// GET /api/complaints
router.get('/', authenticate, async (req, res) => {
  try {
    let complaints = [];
    if (mongoose.connection.readyState === 1) {
      try {
        complaints = await Complaint.find()
          .populate('citizenId', 'name email')
          .populate('assignedWorkerId', 'name email phone')
          .sort({ createdAt: -1 });
      } catch (err) {}
    }

    if (!complaints || complaints.length === 0) {
      complaints = jsonDB.getComplaints();
    }

    res.json(complaints);
  } catch (error) {
    res.json(jsonDB.getComplaints());
  }
});

// GET /api/complaints/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    let complaint;
    try {
      complaint = await Complaint.findById(req.params.id)
        .populate('citizenId', 'name email')
        .populate('assignedWorkerId', 'name email phone');
    } catch (err) {
      complaint = jsonDB.getComplaints().find(c => c._id === req.params.id || c.complaintId === req.params.id);
    }

    if (!complaint) {
      complaint = jsonDB.getComplaints().find(c => c._id === req.params.id || c.complaintId === req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaint', error: error.message });
  }
});

// PATCH /api/complaints/:id/assign
router.patch('/:id/assign', authenticate, async (req, res) => {
  try {
    const { workerId } = req.body;
    const comp = jsonDB.updateComplaintStatus(req.params.id, 'ASSIGNED', { assignedWorkerId: workerId });
    
    // Create or update Task for this worker
    const workers = jsonDB.getWorkers();
    const workerMatch = workers.find(w => w.id === workerId || w._id === workerId) || workers[0];
    const compIdVal = comp?.complaintId || comp?._id || req.params.id;
    const taskId = `TSK-${compIdVal}`;

    jsonDB.updateTask(taskId, {
      _id: taskId,
      taskId: taskId,
      complaintId: comp || { complaintId: compIdVal, category: 'Civic Issue', description: 'Assigned field issue' },
      workerId: workerId,
      worker: workerMatch,
      status: 'ASSIGNED',
      priority: comp?.priority || 'High',
      location: comp?.location || { latitude: 19.0760, longitude: 72.8777, address: 'Reported Site Location' },
      createdAt: new Date().toISOString()
    });

    try {
      await Complaint.findByIdAndUpdate(req.params.id, { status: 'ASSIGNED', assignedWorkerId: workerId });
    } catch (err) {}

    if (req.io) {
      req.io.emit('task:assigned', { complaintId: req.params.id, workerId, taskId });
      req.io.emit('task:updated');
      req.io.emit('complaint:updated', { complaintId: req.params.id, status: 'ASSIGNED' });
    }

    res.json({ message: 'Worker assigned successfully', taskId, workerId });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning worker', error: error.message });
  }
});


export default router;
