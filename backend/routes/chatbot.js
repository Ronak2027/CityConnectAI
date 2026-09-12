import express from 'express';
import { Complaint } from '../models/Complaint.js';

const router = express.Router();

// POST /api/chatbot/query
router.post('/query', async (req, res) => {
  try {
    const { message = '', citizenId } = req.body;
    const text = message.toLowerCase().trim();

    if (text.includes('status') || text.includes('track') || text.includes('my complaint')) {
      if (citizenId) {
        const complaints = await Complaint.find({ citizenId }).sort({ createdAt: -1 }).limit(3);
        if (complaints.length > 0) {
          const listText = complaints.map(c => `• **${c.complaintId}** (${c.category}): ${c.status}`).join('\n');
          return res.json({
            reply: `Here is the current status of your recent complaints:\n\n${listText}\n\nCan I help you with anything else?`,
            actions: [
              { label: 'Report New Issue', action: 'NAVIGATE_REPORT' },
              { label: 'View All Complaints', action: 'NAVIGATE_COMPLAINTS' }
            ]
          });
        }
      }
      return res.json({
        reply: 'You have no active complaints registered. Would you like to submit a new civic issue report?',
        actions: [{ label: 'Report Issue', action: 'NAVIGATE_REPORT' }]
      });
    }

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
      reply: `I am CleanCity AI Assistant. I can help you report civic issues, track your complaints, or check municipal service status. How may I assist you today?`,
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
