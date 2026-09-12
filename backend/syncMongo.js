import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { jsonDB } from './services/storageAdapter.js';
import { User } from './models/User.js';

async function syncToAtlas() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log('[Sync] Connected to MongoDB Atlas. Syncing database records...');

  // 1. Sync Workers to Users Collection
  const workers = jsonDB.getWorkers();
  for (const w of workers) {
    const email = `${w.name.toLowerCase().replace(/\s+/g, '.')}@cleancity.ai`;
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: w.name,
        email,
        phone: w.phone,
        passwordHash: 'worker123',
        role: 'worker',
        department: w.department || w.domain,
        avatar: ''
      });
      console.log(`[Sync] Created worker user: ${w.name} (${email})`);
    }
  }

  // 2. Sync Complaints
  const complaints = jsonDB.getComplaints();
  const complaintsColl = db.collection('complaints');
  for (let i = 0; i < complaints.length; i++) {
    const c = complaints[i];
    const compId = c.complaintId || c._id || `CMP-2026-${1000 + i}`;
    const exists = await complaintsColl.findOne({ complaintId: compId });
    if (!exists) {
      await complaintsColl.insertOne({
        ...c,
        complaintId: compId,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: new Date()
      });
    }
  }
  console.log(`[Sync] Complaints synchronized in Atlas.`);

  // 3. Sync Tasks
  const tasks = jsonDB.getTasks();
  const tasksColl = db.collection('tasks');
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const tId = t.taskId || t._id || `TSK-2026-${1000 + i}`;
    const exists = await tasksColl.findOne({ taskId: tId });
    if (!exists) {
      await tasksColl.insertOne({
        ...t,
        taskId: tId,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: new Date()
      });
    }
  }
  console.log(`[Sync] Tasks synchronized in Atlas.`);

  // 4. Sync Verifications
  const verifications = jsonDB.getVerifications();
  const verifsColl = db.collection('verifications');
  for (let i = 0; i < verifications.length; i++) {
    const v = verifications[i];
    const vId = v.verificationId || v._id || `VER-2026-${1000 + i}`;
    const exists = await verifsColl.findOne({ verificationId: vId });
    if (!exists) {
      await verifsColl.insertOne({
        ...v,
        verificationId: vId,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
        updatedAt: new Date()
      });
    }
  }
  console.log(`[Sync] Verifications synchronized in Atlas.`);

  console.log('[Sync] MongoDB Atlas Synchronization Complete!');
  process.exit(0);
}

syncToAtlas().catch(err => {
  console.error('[Sync Error]', err);
  process.exit(1);
});
