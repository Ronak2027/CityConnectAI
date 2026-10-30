import fs from 'fs';
import path from 'path';

const dataFilePath = path.resolve('data.json');

function readData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading data.json:", err);
  }
  return { complaints: [], tasks: [], verifications: [], workers: [], auditLogs: [] };
}

function writeData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing data.json:", err);
  }
}

export const jsonDB = {
  getComplaints: () => {
    const data = readData();
    const complaints = data.complaints || [];
    const workers = jsonDB.getWorkers();
    return complaints.map(c => {
      let workerObj = null;
      if (c.assignedWorkerId) {
        if (typeof c.assignedWorkerId === 'object' && c.assignedWorkerId?.name) {
          workerObj = c.assignedWorkerId;
        } else {
          const wId = c.assignedWorkerId;
          workerObj = workers.find(w => w.id === wId || w._id === wId || w.name === wId || (typeof wId === 'string' && wId.includes(w.name))) || { name: typeof wId === 'string' ? wId : 'Assigned Worker', department: 'Field Operations' };
        }
      }
      return {
        ...c,
        assignedWorkerId: workerObj
      };
    });
  },
  
  createComplaint: (newComplaint) => {
    const data = readData();
    data.complaints = data.complaints || [];
    data.complaints.unshift(newComplaint);
    writeData(data);
    return newComplaint;
  },

  updateComplaint: (id, updates) => {
    const data = readData();
    data.complaints = data.complaints || [];
    const idx = data.complaints.findIndex(c => c.id === id || c._id === id || c.complaintId === id);
    if (idx !== -1) {
      data.complaints[idx] = { ...data.complaints[idx], ...updates };
      writeData(data);
      return data.complaints[idx];
    }
    return null;
  },

  getTasks: () => {
    const data = readData();
    let tasks = data.tasks || [];
    const workers = jsonDB.getWorkers();

    if (tasks.length === 0) {
      tasks = [
        {
          _id: 'TSK-2026-0001',
          taskId: 'TSK-2026-0001',
          status: 'ASSIGNED',
          priority: 'High',
          workerId: 'WRK-201',
          worker: workers.find(w => w.id === 'WRK-201') || workers[0],
          location: { latitude: 19.0178, longitude: 72.8478, address: 'Dadar Market, Sector 4, Mumbai' },
          complaintId: {
            _id: 'CMP-2026-3117',
            complaintId: 'CMP-2026-3117',
            category: 'Garbage / Waste',
            description: 'Overflowing dumpster and trash heaps blocking main pedestrian pathway.',
            photoUrl: '/uploads/photo-1789181963109-278028914.png'
          },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'TSK-2026-0002',
          taskId: 'TSK-2026-0002',
          status: 'ASSIGNED',
          priority: 'Critical',
          workerId: 'WRK-202',
          worker: workers.find(w => w.id === 'WRK-202') || workers[1],
          location: { latitude: 19.0222, longitude: 72.8561, address: 'Wadala Station Bridge, Ward 5, Mumbai' },
          complaintId: {
            _id: 'CMP-1002',
            complaintId: 'CMP-1002',
            category: 'Clogged Drains',
            description: 'Severe plastic waste blockage in the storm drain. High risk of monsoon waterlogging.',
            photoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80'
          },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'TSK-2026-0003',
          taskId: 'TSK-2026-0003',
          status: 'ASSIGNED',
          priority: 'Medium',
          workerId: 'WRK-203',
          worker: workers.find(w => w.id === 'WRK-203') || workers[2],
          location: { latitude: 19.0125, longitude: 72.839, address: 'High School Ave, Prabhadevi, Mumbai' },
          complaintId: {
            _id: 'CMP-1003',
            complaintId: 'CMP-1003',
            category: 'Faulty Streetlights',
            description: '3 Unlit Streetlights on High School Avenue causing commuter visibility hazard.',
            photoUrl: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=600&q=80'
          },
          createdAt: new Date().toISOString()
        }
      ];
      data.tasks = tasks;
      writeData(data);
    }

    return tasks.map(t => {
      const wId = typeof t.workerId === 'object' ? (t.workerId?.id || t.workerId?._id) : t.workerId;
      const workerMatch = workers.find(w => w.id === wId || w._id === wId) || workers[0];
      return {
        ...t,
        workerId: wId || workerMatch.id,
        worker: workerMatch
      };
    });
  },

  createTask: (newTask) => {
    const data = readData();
    data.tasks = data.tasks || [];
    data.tasks.unshift(newTask);
    writeData(data);
    return newTask;
  },


  getVerifications: () => {
    const list = readData().verifications || [];
    if (list.length === 0) {
      return [
        {
          _id: 'VER-2026-0001',
          verificationId: 'VER-2026-0001',
          beforeImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
          afterImage: 'https://images.unsplash.com/photo-1532996679820-b553ba67a845?auto=format&fit=crop&w=600&q=80',
          imageVerification: {
            status: 'PASSED',
            confidence: 94,
            ssimScore: 0.89,
            detectedChanges: ['Garbage cleared', 'Area disinfected'],
            reason: 'Multi-factor YOLOv8 & SSIM resolution analysis complete. Defect cleared.',
            aiModelUsed: 'CityConnectAI YOLOv8 Engine'
          },
          gpsVerification: {
            passed: true,
            distanceMeters: 4.2,
            maxAllowedMeters: 9.0
          },
          workerLocation: { latitude: 19.0178, longitude: 72.8478 },
          complaintLocation: { latitude: 19.0178, longitude: 72.8478 },
          captureTimestamp: new Date().toISOString(),
          cameraVerification: true,
          status: 'PENDING',
          workerId: { name: 'Vikram Singh', department: 'Sanitation & Solid Waste', phone: '+91 9876543210' },
          complaintId: { complaintId: 'CMP-2026-1001', category: 'Garbage / Waste' }
        }
      ];
    }
    return list;
  },

  createVerification: (newVerif) => {
    const data = readData();
    data.verifications = data.verifications || [];
    data.verifications.unshift(newVerif);
    writeData(data);
    return newVerif;
  },

  updateComplaintStatus: (id, status, extra = {}) => {
    const data = readData();
    const item = (data.complaints || []).find(c => c._id === id || c.id === id || c.complaintId === id);
    if (item) {
      item.status = status;
      Object.assign(item, extra);
      writeData(data);
    }
    return item;
  },

  updateVerification: (id, status, extra = {}) => {
    const data = readData();
    const item = (data.verifications || []).find(v => v._id === id || v.id === id || v.verificationId === id);
    if (item) {
      item.status = status;
      Object.assign(item, extra);
      writeData(data);
    }
    return item;
  },

  updateTask: (id, updateData = {}) => {
    const data = readData();
    data.tasks = data.tasks || [];
    let item = data.tasks.find(t => t._id === id || t.id === id || t.taskId === id);
    if (item) {
      Object.assign(item, updateData);
    } else {
      item = { _id: id, taskId: id, ...updateData };
      data.tasks.unshift(item);
    }
    writeData(data);
    return item;
  },

  findTask: (id) => {
    const data = readData();
    return (data.tasks || []).find(t => t._id === id || t.id === id || t.taskId === id);
  },

  findComplaint: (id) => {
    const data = readData();
    return (data.complaints || []).find(c => c._id === id || c.id === id || c.complaintId === id);
  },

  getWorkers: () => {
    const raw = readData().workers || [];
    if (raw.length === 0) {
      return [
        { _id: 'WRK-201', id: 'WRK-201', name: 'Ramesh Shinde', phone: '+91 98201 12345', department: 'Waste Management', domain: 'Waste Management', zone: 'Ward 4 - Central Zone', status: 'ON_DUTY', rating: 4.8 },
        { _id: 'WRK-202', id: 'WRK-202', name: 'Suresh Kumar', phone: '+91 98202 23456', department: 'Drainage & Flooding', domain: 'Drainage & Flooding', zone: 'Ward 5 - Wadala East', status: 'ON_DUTY', rating: 4.9 },
        { _id: 'WRK-203', id: 'WRK-203', name: 'Amit Patel', phone: '+91 98203 34567', department: 'Electrical & Streetlights', domain: 'Electrical & Streetlights', zone: 'Ward 3 - Prabhadevi', status: 'ON_DUTY', rating: 4.7 }
      ];
    }
    return raw.map(w => ({
      _id: w.id || w._id,
      id: w.id || w._id,
      name: w.name,
      phone: w.phone,
      department: w.domain || w.department || 'Operations',
      domain: w.domain || w.department || 'Operations',
      zone: w.zone || 'Ward 4 - Central Zone',
      status: w.status || 'ON_DUTY',
      rating: w.rating || 4.8
    }));
  }
};


