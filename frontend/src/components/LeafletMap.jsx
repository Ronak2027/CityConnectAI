import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, CheckCircle2, Clock, User, ShieldAlert } from 'lucide-react';

// Fix standard marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored HTML SVG map markers
const createColorIcon = (color, isPulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${isPulse ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${color}; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 26px; height: 26px; border-radius: 50%; background: ${color}; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const iconRed = createColorIcon('#DC2626', true);      // Critical / Pending
const iconYellow = createColorIcon('#F59E0B', false);   // Attention / Assigned
const iconGreen = createColorIcon('#16A34A', false);    // Resolved
const iconBlue = createColorIcon('#2563EB', true);      // Worker
const iconPurple = createColorIcon('#9333EA', false);   // Vehicle

export default function LeafletMap({ complaints = [], workers = [], height = "450px", center = [19.0760, 72.8777], zoom = 12 }) {
  // Use first complaint coordinates if center default
  const mapCenter = complaints.length > 0 && complaints[0].location?.latitude
    ? [complaints[0].location.latitude, complaints[0].location.longitude]
    : center;

  return (
    <div style={{ height }} className="w-full rounded-card overflow-hidden border border-brand-border shadow-sm relative z-0">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Complaints Markers */}
        {complaints.map((c) => {
          if (!c.location?.latitude || !c.location?.longitude) return null;

          let markerIcon = iconRed;
          if (c.status === 'RESOLVED') markerIcon = iconGreen;
          else if (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') markerIcon = iconYellow;

          return (
            <Marker key={c._id} position={[c.location.latitude, c.location.longitude]} icon={markerIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-2 max-w-xs text-brand-text">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-brand-emerald uppercase tracking-wider">{c.complaintId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                      c.status === 'RESOLVED' ? 'bg-brand-success' : c.priority === 'Critical' ? 'bg-brand-critical' : 'bg-brand-warning'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{c.category}</h4>
                  <p className="text-xs text-brand-muted line-clamp-2 mb-2">{c.description || 'No description provided.'}</p>
                  
                  <div className="text-[11px] space-y-1 text-gray-600 border-t border-gray-100 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Department:</span>
                      <span className="font-medium">{c.department || 'Sanitation'}</span>
                    </div>
                    {c.assignedWorkerId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Assigned:</span>
                        <span className="font-medium text-brand-blue">{c.assignedWorkerId.name || 'Worker'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Reported:</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Worker Markers */}
        {workers.map((w, idx) => (
          <Marker 
            key={w._id || idx} 
            position={[mapCenter[0] + (idx + 1) * 0.008, mapCenter[1] + (idx + 1) * 0.006]} 
            icon={iconBlue}
          >
            <Popup>
              <div className="p-1">
                <div className="text-xs font-bold text-brand-blue mb-1">👷 Active Field Worker</div>
                <div className="text-sm font-semibold">{w.name}</div>
                <div className="text-xs text-brand-muted font-mono font-medium">Worker ID: {w.id || w._id || 'WRK'}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
