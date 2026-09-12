import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, MapPin, Camera, AlertCircle, CheckCircle2, Clock, 
  Trash2, Wrench, Droplets, Lightbulb, AlertTriangle, FileText, ChevronRight, X 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { reverseGeocode } from '../utils/geocoding';

const CATEGORIES = [
  { id: 'Garbage', label: 'Garbage / Waste', icon: Trash2, color: 'bg-emerald-100 text-brand-emerald' },
  { id: 'Road', label: 'Road / Pothole', icon: Wrench, color: 'bg-blue-100 text-brand-blue' },
  { id: 'Drainage', label: 'Drainage / Overflow', icon: Droplets, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'Streetlight', label: 'Streetlight Broken', icon: Lightbulb, color: 'bg-amber-100 text-amber-600' },
  { id: 'Water Leakage', label: 'Water Pipe Leakage', icon: Droplets, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'Illegal Dumping', label: 'Illegal Waste Dump', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  { id: 'Open Manhole', label: 'Open Manhole Hazard', icon: AlertTriangle, color: 'bg-rose-100 text-rose-600' },
  { id: 'Public Toilet', label: 'Public Sanitation', icon: FileText, color: 'bg-purple-100 text-purple-600' },
];

export default function CitizenPortal() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gps, setGps] = useState({ lat: null, lng: null, status: 'idle', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      console.warn("Failed to load citizen complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Browser Geolocation API with Reverse Geocoding
  const requestGpsLocation = () => {
    setGps(prev => ({ ...prev, status: 'requesting', address: 'Detecting GPS coordinates...' }));
    if (!navigator.geolocation) {
      setGps({ lat: null, lng: null, status: 'error', address: 'Geolocation not supported by this browser' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGps({
          lat,
          lng,
          status: 'resolving',
          address: 'Resolving street & area address...'
        });

        const address = await reverseGeocode(lat, lng);
        setGps({
          lat,
          lng,
          status: 'success',
          address: address || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
        });
      },
      (error) => {
        console.warn('GPS location request error:', error.message);
        // Fallback default coordinates so citizen is never blocked
        setGps({ 
          lat: 19.0760, 
          lng: 72.8777, 
          status: 'manual', 
          address: '' 
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleNextStep = () => {
    setFormError('');
    if (step === 1 && !category) {
      setFormError('Please select a problem category.');
      return;
    }
    if (step === 2) {
      if (gps.lat === null || gps.lng === null) {
        setFormError('Please click "Detect My Location" or enter your physical location.');
        return;
      }
      if (!gps.address || gps.address.trim().length === 0) {
        setFormError('Please provide a physical street address or area landmark.');
        return;
      }
    }
    if (step === 3 && !photo && (!description || description.trim().length === 0)) {
      setFormError('A detailed description is required when no photo is attached.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmitComplaint = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('latitude', gps.lat);
      formData.append('longitude', gps.lng);
      formData.append('address', gps.address);
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await axios.post('/api/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessComplaint(res.data.complaint);
      fetchComplaints();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit complaint. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setCategory('');
    setDescription('');
    setPhoto(null);
    setPhotoPreview(null);
    setGps({ lat: null, lng: null, status: 'idle', address: '' });
    setFormError('');
    setSuccessComplaint(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-card border border-brand-border shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-text">
            Good Morning 👋 {user?.name || 'Citizen'}
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Report civic issues in your neighborhood with real-time AI & GPS tracking.
          </p>
        </div>
        <button
          onClick={() => { resetModal(); setIsModalOpen(true); }}
          className="px-6 py-3.5 bg-brand-emerald text-white rounded-2xl font-bold text-xs hover:bg-[#066749] shadow-md shadow-brand-emerald/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>+ Report Civic Issue</span>
        </button>
      </div>

      {/* Stats Quick Counter */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-brand-border text-center">
          <div className="text-2xl font-extrabold text-brand-text">{complaints.length}</div>
          <div className="text-[11px] font-semibold text-brand-muted uppercase">My Complaints</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-border text-center">
          <div className="text-2xl font-extrabold text-brand-warning">
            {complaints.filter(c => ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'VERIFICATION'].includes(c.status)).length}
          </div>
          <div className="text-[11px] font-semibold text-brand-muted uppercase">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-border text-center">
          <div className="text-2xl font-extrabold text-brand-success">
            {complaints.filter(c => c.status === 'RESOLVED').length}
          </div>
          <div className="text-[11px] font-semibold text-brand-muted uppercase">Resolved</div>
        </div>
      </div>

      {/* Complaints List Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-brand-text">My Reported Issues</h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState 
            title="No complaints yet" 
            description="Once you report a civic issue, your active tracking timeline will appear here."
            actionButton={
              <button 
                onClick={() => { resetModal(); setIsModalOpen(true); }}
                className="px-5 py-2.5 bg-brand-emerald text-white rounded-xl text-xs font-bold"
              >
                Report First Issue
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((c, idx) => (
              <div key={c._id || c.id || c.complaintId || idx} className="bg-white rounded-card border border-brand-border p-6 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-brand-emerald bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {c.complaintId}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    c.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <h4 className="font-bold text-base text-brand-text mb-1">{c.category}</h4>
                <p className="text-xs text-brand-muted line-clamp-2 mb-2">{c.description || 'Photo attached'}</p>

                {/* Location Display */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl mb-3 border border-gray-100">
                  <MapPin className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span className="truncate">{c.location?.address || `${c.location?.latitude?.toFixed(4)}, ${c.location?.longitude?.toFixed(4)}`}</span>
                </div>

                {/* Progress Timeline (Requirement #17) */}
                <div className="border-t border-gray-100 pt-3 text-xs space-y-2">
                  <div className="flex items-center justify-between text-brand-muted text-[11px]">
                    <span>Department: <strong className="text-brand-text">{c.department}</strong></span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Timeline Bar */}
                  <div className="flex items-center gap-1 pt-1">
                    {['Submitted', 'Assigned', 'In Progress', 'Verification', 'Resolved'].map((st, idx) => {
                      const statusMap = { PENDING: 0, ASSIGNED: 1, IN_PROGRESS: 2, VERIFICATION: 3, RESOLVED: 4 };
                      const currentIdx = statusMap[c.status] ?? 0;
                      const isActive = idx <= currentIdx;
                      return (
                        <div key={st} className="flex-1 flex flex-col items-center">
                          <div className={`h-1.5 w-full rounded-full ${isActive ? 'bg-brand-emerald' : 'bg-gray-200'}`}></div>
                          <span className={`text-[9px] mt-1 ${isActive ? 'text-brand-emerald font-bold' : 'text-gray-400'}`}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MULTI-STEP REPORT ISSUE MODAL (Requirement #16) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-card shadow-2xl border border-brand-border w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-bg">
                <div>
                  <h3 className="font-bold text-base text-brand-text">Report Civic Issue</h3>
                  <p className="text-xs text-brand-muted">Step {step} of 4</p>
                </div>
                <button onClick={resetModal} className="text-gray-400 hover:text-brand-text p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {formError && (
                  <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* SUCCESS SCREEN */}
                {successComplaint ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-brand-emerald flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="font-extrabold text-xl text-brand-text">Complaint Registered!</h3>
                    <p className="text-xs text-brand-muted">Your complaint has been submitted to municipal teams.</p>
                    <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border text-center">
                      <div className="text-xs text-brand-muted">Complaint ID</div>
                      <div className="text-xl font-mono font-extrabold text-brand-emerald">{successComplaint.complaintId}</div>
                    </div>
                    <button onClick={resetModal} className="w-full py-3 bg-brand-emerald text-white font-bold text-xs rounded-xl">
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    {/* STEP 1: CATEGORY */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-brand-text">What is the problem?</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                                  isSelected 
                                    ? 'border-brand-emerald bg-emerald-50/50 shadow-xs' 
                                    : 'border-brand-border hover:bg-gray-50'
                                }`}
                              >
                                <div className={`p-2 rounded-xl ${cat.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold text-brand-text">{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: LOCATION / GPS (MANDATORY) */}
                    {step === 2 && (
                      <div className="space-y-4 text-center py-2">
                        <div className="w-14 h-14 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
                          <MapPin className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-sm text-brand-text">Exact Incident Location</h4>
                        <p className="text-xs text-brand-muted">
                          Accurate GPS and street address are required so municipal workers can navigate directly to the site.
                        </p>

                        <button
                          type="button"
                          onClick={requestGpsLocation}
                          disabled={gps.status === 'requesting' || gps.status === 'resolving'}
                          className="w-full py-3.5 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                        >
                          <MapPin className="w-4 h-4" />
                          {gps.status === 'requesting' 
                            ? 'Acquiring High-Accuracy GPS...' 
                            : gps.status === 'resolving' 
                            ? 'Resolving Street Address via OpenStreetMap...' 
                            : '📍 Detect My Exact GPS Location'}
                        </button>

                        {/* Location Details & Editable Physical Address */}
                        {(gps.status === 'success' || gps.status === 'manual') && (
                          <div className="text-left space-y-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {gps.status === 'success' ? 'GPS Coordinates Verified' : 'Manual Location Set'}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                {gps.lat?.toFixed(5)}, {gps.lng?.toFixed(5)}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                                <span>Street Address / Neighborhood / Landmark:</span>
                                <span className="text-[10px] text-emerald-700 font-normal">Editable</span>
                              </label>
                              <textarea
                                value={gps.address}
                                onChange={(e) => setGps(prev => ({ ...prev, address: e.target.value }))}
                                rows={2}
                                placeholder="e.g. Near City Bank ATM, MG Road, Ward 4..."
                                className="w-full text-xs p-3 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-white text-brand-text shadow-2xs"
                              />
                              <p className="text-[10px] text-gray-500">
                                Tip: Confirm or add building name, floor, or nearby landmark for field workers.
                              </p>
                            </div>
                          </div>
                        )}

                        {gps.status === 'error' && (
                          <div className="text-left space-y-2 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-700" /> GPS Unavailable or Denied
                            </div>
                            <p className="text-[11px] text-amber-800">
                              Please enter the street address or area landmark manually below:
                            </p>
                            <input
                              type="text"
                              value={gps.address}
                              onChange={(e) => setGps(prev => ({ 
                                ...prev, 
                                address: e.target.value, 
                                lat: prev.lat || 19.0760, 
                                lng: prev.lng || 72.8777, 
                                status: 'manual' 
                              }))}
                              placeholder="e.g. Linking Road, Bandra West, Mumbai..."
                              className="w-full text-xs p-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 3: DESCRIPTION & PHOTO */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-brand-text">Tell us about the issue</h4>
                        
                        <div>
                          <label className="text-xs font-semibold text-brand-muted block mb-1">
                            Photo Evidence (Optional):
                          </label>
                          <label className="border-2 border-dashed border-brand-border hover:border-brand-emerald rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                            <Camera className="w-6 h-6 text-brand-muted mb-1" />
                            <span className="text-xs text-brand-muted">Click to upload image photo</span>
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                          </label>
                          {photoPreview && (
                            <img src={photoPreview} alt="Preview" className="mt-2 h-28 rounded-xl object-cover w-full border" />
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-brand-muted block mb-1">
                            Description {photo ? '(Optional)' : '(REQUIRED if no photo)'}:
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the complaint location or severity..."
                            className="w-full text-xs p-3 border border-brand-border rounded-xl outline-none focus:border-brand-emerald"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 4 && (
                      <div className="space-y-4 text-xs">
                        <h4 className="font-bold text-sm text-brand-text">Review Details</h4>
                        <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border space-y-2.5">
                          <div className="flex justify-between">
                            <span className="text-brand-muted">Category:</span>
                            <span className="font-bold text-brand-text">{category}</span>
                          </div>
                          <div className="flex justify-between items-start gap-3">
                            <span className="text-brand-muted shrink-0">Street Address:</span>
                            <span className="font-bold text-brand-text text-right break-words">{gps.address || 'Address'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-brand-muted">GPS Coordinates:</span>
                            <span className="font-mono text-brand-blue">{gps.lat?.toFixed(5)}, {gps.lng?.toFixed(5)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-brand-muted">Description:</span>
                            <span className="font-medium text-brand-text">{description || 'Photo attached'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              {!successComplaint && (
                <div className="p-5 border-t border-brand-border bg-brand-bg flex items-center justify-between">
                  {step > 1 ? (
                    <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-xs font-semibold text-brand-muted">
                      Back
                    </button>
                  ) : <div></div>}

                  {step < 4 ? (
                    <button onClick={handleNextStep} className="px-6 py-2.5 bg-brand-emerald text-white text-xs font-bold rounded-xl">
                      Next Step
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmitComplaint} 
                      disabled={submitting}
                      className="px-6 py-2.5 bg-brand-emerald text-white text-xs font-bold rounded-xl hover:bg-[#066749]"
                    >
                      {submitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
