import express from 'express';
import mongoose from 'mongoose';
import { Complaint } from '../models/Complaint.js';
import { jsonDB } from '../services/storageAdapter.js';
import { askGeminiChatbot } from '../services/geminiService.js';

const router = express.Router();

// POST /api/chatbot/query
router.post('/query', async (req, res) => {
  try {
    const { message = '', citizenId } = req.body;
    const text = message.toLowerCase().trim();

    // 1. Gather citizen complaints for context
    let complaints = [];
    if (citizenId) {
      if (mongoose.connection.readyState === 1) {
        try {
          complaints = await Complaint.find({ citizenId }).sort({ createdAt: -1 }).limit(3);
        } catch (err) {}
      }
      if (!complaints || complaints.length === 0) {
        const allC = jsonDB.getComplaints();
        complaints = allC.filter(c => c.citizenId === citizenId || !c.citizenId).slice(0, 3);
      }
    }

    // 2. Direct fast-path for tracking when complaints are present
    if (text.includes('status') || text.includes('track') || text.includes('my complaint')) {
      if (complaints && complaints.length > 0) {
        const listText = complaints.map(c => `• **${c.complaintId || c._id}** (${c.category}): ${c.status}`).join('\n');
        return res.json({
          reply: `Here is the current status of your recent complaints:\n\n${listText}\n\nCan I help you with anything else?`,
          actions: [
            { label: 'Report New Issue', action: 'NAVIGATE_REPORT' },
            { label: 'View All Complaints', action: 'NAVIGATE_COMPLAINTS' }
          ]
        });
      }
    }

    // 3. Ask Google Gemini for intelligent conversation & guidance
    const geminiReply = await askGeminiChatbot(message, { complaints });
    if (geminiReply && geminiReply.reply) {
      const actions = [];
      if (text.includes('garbage') || text.includes('waste') || text.includes('clean')) {
        actions.push({ label: 'Report Garbage Issue', action: 'START_REPORT_GARBAGE' });
      } else if (text.includes('pothole') || text.includes('road') || text.includes('drain')) {
        actions.push({ label: 'Report Road Hazard', action: 'START_REPORT_ROAD' });
      } else {
        actions.push({ label: 'Report an Issue', action: 'NAVIGATE_REPORT' });
        actions.push({ label: 'Check Status', action: 'CHECK_STATUS' });
      }

      return res.json({
        reply: geminiReply.reply,
        actions,
        poweredBy: 'CityConnectAI'
      });
    }

    // 4. Fallback rule responses if offline
    if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('clean')) {
      return res.json({
        reply: 'I can assist you with reporting uncollected garbage, overflowing bins, or illegal dumping. Would you like to file a Sanitation complaint now with GPS location?',
        actions: [
          { label: 'Report Garbage Issue', action: 'START_REPORT_GARBAGE' },
          { label: 'Check Service Schedule', action: 'FAQ_GARBAGE' }
        ]
      });
    }

    if (text.includes('pothole') || text.includes('road') || text.includes('manhole') || text.includes('drain')) {
      return res.json({
        reply: 'Damaged roads and open manholes are flagged as high priority for civic safety. Click below to submit an issue report with mandatory GPS coordinates.',
        actions: [{ label: 'Report Road Hazard', action: 'START_REPORT_ROAD' }]
      });
    }

    // Default intelligent assistant response
    return res.json({
      reply: `I am CityConnectAI Assistant. I can help you report civic issues, track your complaints, or answer city maintenance queries. How may I assist you today?`,
      actions: [
        { label: 'Report an Issue', action: 'NAVIGATE_REPORT' },
        { label: 'Check Complaint Status', action: 'CHECK_STATUS' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing chatbot query', error: error.message });
  }
});

export default router;
