import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { Complaint } from '../models/Complaint.js';
import { jsonDB } from '../services/storageAdapter.js';

const router = express.Router();

// GET /api/weather
router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const city = req.query.city || 'Mumbai';

    if (apiKey) {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
      );
      const data = response.data;

      return res.json({
        city: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        rainMm: data.rain ? (data.rain['1h'] || 0) : 0,
        icon: data.weather[0].icon
      });
    }

    // Fallback real-world weather default structure when key is not set
    res.json({
      city,
      temperature: 28,
      condition: 'Rainy',
      description: 'Moderate rain expected',
      humidity: 82,
      windSpeed: 14,
      rainMm: 12.5,
      icon: '10d'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weather data', error: error.message });
  }
});

// GET /api/weather/flood-risk & /api/weather/hotspots (AI Complaint Hotspot & Attention Intelligence)
const getHotspotsHandler = async (req, res) => {
  try {
    let complaints = [];
    if (mongoose.connection.readyState === 1) {
      try {
        complaints = await Complaint.find();
      } catch (err) {}
    }
    if (!complaints || complaints.length === 0) {
      complaints = jsonDB.getComplaints();
    }

    // Cluster complaints by neighborhood / street address
    const clusterMap = {};

    complaints.forEach((c) => {
      let rawAddr = (c.location?.address || c.citizenLocation?.address || '').trim();
      if (!rawAddr && c.location?.latitude && c.location?.longitude) {
        rawAddr = `Sector (${c.location.latitude.toFixed(3)}, ${c.location.longitude.toFixed(3)})`;
      }
      if (!rawAddr) rawAddr = 'Central Municipal Zone';

      // Clean area name (take first 2 comma-separated segments)
      const parts = rawAddr.split(',').map(p => p.trim());
      const areaName = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];

      if (!clusterMap[areaName]) {
        clusterMap[areaName] = {
          areaName,
          fullAddress: rawAddr,
          totalComplaints: 0,
          activeComplaints: 0,
          resolvedComplaints: 0,
          categories: {},
          latitude: c.location?.latitude || c.citizenLocation?.lat || 19.0760,
          longitude: c.location?.longitude || c.citizenLocation?.lng || 72.8777
        };
      }

      clusterMap[areaName].totalComplaints += 1;
      const isResolved = c.status === 'RESOLVED' || c.status === 'COMPLETED';
      if (isResolved) {
        clusterMap[areaName].resolvedComplaints += 1;
      } else {
        clusterMap[areaName].activeComplaints += 1;
      }

      const cat = c.category || 'Civic Infrastructure';
      clusterMap[areaName].categories[cat] = (clusterMap[areaName].categories[cat] || 0) + 1;
    });

    const clusters = Object.values(clusterMap).map(cl => {
      // Find dominant issue category
      const dominantCat = Object.entries(cl.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Civic Infrastructure';
      const isHotspot = cl.totalComplaints >= 5;
      const alertLevel = cl.totalComplaints >= 5 ? 'CRITICAL_HOTSPOT' : cl.totalComplaints >= 3 ? 'ELEVATED' : 'NORMAL';

      return {
        ...cl,
        dominantCategory: dominantCat,
        isHotspot,
        alertLevel,
        thresholdMet: cl.totalComplaints >= 5
      };
    }).sort((a, b) => b.totalComplaints - a.totalComplaints);

    const criticalHotspots = clusters.filter(c => c.isHotspot);
    const topHotspot = clusters[0] || {
      areaName: 'City Center Zone',
      totalComplaints: 0,
      activeComplaints: 0,
      dominantCategory: 'Civic Infrastructure'
    };

    let riskLevel = 'LOW';
    let alertMessage = 'All municipal areas operating normally. No neighborhood exceeds the 5-complaint critical threshold.';
    let recommendation = 'Maintain routine municipal surveillance and standard worker dispatch.';

    if (criticalHotspots.length > 0) {
      riskLevel = 'HIGH ATTENTION REQUIRED';
      alertMessage = `🚨 URGENT HOTSPOT DETECTED: ${criticalHotspots.length} area(s) have 5 or more clustered complaints! Highest priority in ${topHotspot.areaName} with ${topHotspot.totalComplaints} complaints (${topHotspot.dominantCategory}).`;
      recommendation = `Deploy rapid response squad and notify Ward Supervisor immediately for ${topHotspot.areaName}. Address ${topHotspot.activeComplaints} pending issues to prevent civic disruption.`;
    } else if (topHotspot.totalComplaints >= 3) {
      riskLevel = 'ELEVATED ATTENTION';
      alertMessage = `Moderate complaint concentration in ${topHotspot.areaName} (${topHotspot.totalComplaints} complaints). Approaching the 5-complaint threshold.`;
      recommendation = `Schedule priority field inspection for ${topHotspot.areaName} within 24 hours.`;
    }

    res.json({
      riskLevel,
      alertMessage,
      recommendation,
      threshold: 5,
      criticalHotspotsCount: criticalHotspots.length,
      topHotspot,
      clusters,
      metrics: {
        totalClusters: clusters.length,
        criticalCount: criticalHotspots.length,
        highestDensity: topHotspot.totalComplaints,
        affectedZones: clusters.slice(0, 3).map(c => c.areaName)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing complaint hotspots', error: error.message });
  }
};

router.get('/flood-risk', getHotspotsHandler);
router.get('/hotspots', getHotspotsHandler);

export default router;
