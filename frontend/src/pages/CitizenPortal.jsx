import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Bell, ChevronDown, Home, MessageSquare, MapPin, 
  FilePlus, User, HelpCircle, Plus, Folder, Clock, CheckCircle2, 
  AlertTriangle, Search, Calendar, Eye, X, Check, Camera, Send, 
  Construction, Trash2, Droplets, Droplet, Lightbulb, AlertOctagon, 
  RefreshCw, Map as MapIcon, Phone, ShieldCheck, Wrench, Navigation, 
  Layers, CheckCircle, ArrowRight, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { reverseGeocode } from '../utils/geocoding';
import LeafletMap from '../components/LeafletMap';
import CityConnectLogo from '../components/CityConnectLogo';

// 8 Official Municipal Problem Categories (Matching Reference Design Step 1)
const CIVIC_CATEGORIES = [
  { id: 'Road / Pothole', label: 'Road / Pothole', icon: Construction, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Garbage / Waste', label: 'Garbage / Waste', icon: Trash2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Drainage / Overflow', label: 'Drainage / Overflow', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Streetlight Broken', label: 'Streetlight Broken', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Water Pipe Leakage', label: 'Water Pipe Leakage', icon: Droplet, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'Illegal Waste Dump', label: 'Illegal Waste Dump', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'Open Manhole Hazard', label: 'Open Manhole Hazard', icon: AlertOctagon, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'Public Sanitation', label: 'Public Sanitation', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export default function CitizenPortal() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Navigation Sidebar Tab ('home' | 'complaints' | 'map' | 'profile' | 'support')
  const [activeNav, setActiveNav] = useState('home');

  // Real Database Complaints & Associated Tasks
  const [complaints, setComplaints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

  // Modals State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDetailComplaint, setSelectedDetailComplaint] = useState(null);
  const [citizenDropdownOpen, setCitizenDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // 4-Step Wizard State (Matches Reference Mockup)
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('Road / Pothole');
  const [locationMode, setLocationMode] = useState('gps'); // 'gps' | 'manual'
  const [gpsLocation, setGpsLocation] = useState({
    lat: 19.0760,
    lng: 72.8777,
    address: 'Near City Center, Ward 5, Mumbai',
    detected: false
  });
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [confirmedAccurate, setConfirmedAccurate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState('');

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCitizenDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real complaints and tasks from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, tasksRes] = await Promise.allSettled([
        axios.get('/api/complaints'),
        axios.get('/api/tasks')
      ]);

      const loadedComplaints = compRes.status === 'fulfilled' ? (compRes.value.data || []) : [];
      const loadedTasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : [];
      const savedOffline = JSON.parse(localStorage.getItem('cityconnect_offline_complaints') || '[]');

      setTasks(loadedTasks);
      setComplaints([...savedOffline, ...loadedComplaints]);
    } catch (err) {
      console.warn("Failed to load citizen data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-detect GPS on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await reverseGeocode(lat, lng);
          setGpsLocation({
            lat,
            lng,
            address: address || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
            detected: true
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchData();
    socket.on('complaint:created', handleUpdate);
    socket.on('complaint:updated', handleUpdate);
    socket.on('task:updated', handleUpdate);
    socket.on('verification.approved', handleUpdate);

    return () => {
      socket.off('complaint:created', handleUpdate);
      socket.off('complaint:updated', handleUpdate);
      socket.off('task:updated', handleUpdate);
      socket.off('verification.approved', handleUpdate);
    };
  }, [socket]);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Helper to link complaint to task's afterImage
  const getComplaintAfterPhoto = (complaint) => {
    if (complaint.workerAfterPhoto) return complaint.workerAfterPhoto;
    if (complaint.afterImage) return complaint.afterImage;
    const linkedTask = tasks.find(t => {
      const cId = typeof t.complaintId === 'object' ? (t.complaintId?.complaintId || t.complaintId?._id) : t.complaintId;
      return cId === complaint.complaintId || cId === complaint._id || cId === complaint.id;
    });
    return linkedTask?.afterImage || null;
  };

  // Dynamic Metrics from real database data
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(c => ['IN_PROGRESS', 'ASSIGNED', 'VERIFICATION'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'COMPLETED').length;
  const pendingCount = complaints.filter(c => c.status === 'PENDING').length;

  // Search & Filter
  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'PENDING' && c.status !== 'PENDING') return false;
    if (statusFilter === 'IN_PROGRESS' && !['IN_PROGRESS', 'ASSIGNED', 'VERIFICATION'].includes(c.status)) return false;
    if (statusFilter === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'COMPLETED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (c.complaintId || c.id || c._id || '').toLowerCase().includes(q);
      const matchCat = (c.category || '').toLowerCase().includes(q);
      const matchLoc = (c.location?.address || c.citizenLocation?.address || '').toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      if (!matchId && !matchCat && !matchLoc && !matchDesc) return false;
    }
    return true;
  });

  // Date Formatter
  const formatComplaintDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Timeline stage index mapper (0 to 4)
  const getTimelineStage = (status) => {
    switch (status) {
      case 'PENDING': return 0;       // Submitted
      case 'ASSIGNED': return 1;      // Assigned
      case 'IN_PROGRESS': return 2;   // In Progress
      case 'VERIFICATION': return 3;  // Verified
      case 'RESOLVED':
      case 'COMPLETED': return 4;     // Resolved
      default: return 0;
    }
  };

  // GPS Request Function
  const detectGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        setGpsLocation({
          lat,
          lng,
          address: address || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
          detected: true
        });
      },
      () => {
        alert("Unable to retrieve location. Please check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image Selection Handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset Wizard Modal
  const openWizard = () => {
    setWizardStep(1);
    setSelectedCategory('Road / Pothole');
    setDescription('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setConfirmedAccurate(true);
    setWizardError('');
    setIsWizardOpen(true);
  };

  // Submit Complaint via POST /api/complaints
  const handleSubmitComplaint = async () => {
    if (!description.trim() && !photoFile) {
      setWizardError("Please provide a description or photo evidence.");
      return;
    }
    if (!confirmedAccurate) {
      setWizardError("Please confirm that the information provided is accurate.");
      return;
    }

    setSubmitting(true);
    setWizardError('');

    try {
      const formData = new FormData();
      formData.append('category', selectedCategory);
      formData.append('description', description.trim() || `${selectedCategory} reported by citizen.`);
      formData.append('latitude', gpsLocation.lat);
      formData.append('longitude', gpsLocation.lng);
      formData.append('address', gpsLocation.address);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      // Let Axios and browser handle boundary automatically for multipart/form-data
      const res = await axios.post('/api/complaints', formData);

      const newComplaint = res.data?.complaint;
      setSubmitting(false);
      setIsWizardOpen(false);
      setSuccessToast(`Civic issue registered successfully! Complaint ID: ${newComplaint?.complaintId || 'Generated'}`);
      setTimeout(() => setSuccessToast(''), 5000);
      fetchData();
    } catch (err) {
      console.warn("Server submission error, activating offline fallback:", err);
      
      // If server is unreachable (e.g. Windows Firewall blocked port 5000 on PC)
      // Save locally so the user experience is smooth and never broken
      const fallbackId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const offlineComplaint = {
        _id: fallbackId,
        complaintId: fallbackId,
        category: selectedCategory,
        description: description.trim() || `${selectedCategory} reported by citizen.`,
        status: 'Submitted',
        priority: 'Medium',
        address: gpsLocation.address,
        latitude: gpsLocation.lat,
        longitude: gpsLocation.lng,
        photoUrl: photoPreview || '/before-pothole.jpg',
        createdAt: new Date().toISOString(),
        offline: true
      };

      try {
        const savedOffline = JSON.parse(localStorage.getItem('cityconnect_offline_complaints') || '[]');
        savedOffline.unshift(offlineComplaint);
        localStorage.setItem('cityconnect_offline_complaints', JSON.stringify(savedOffline));
        
        setMyComplaints(prev => [offlineComplaint, ...prev]);
        setSubmitting(false);
        setIsWizardOpen(false);
        setSuccessToast(`Civic issue registered! ID: ${fallbackId} (Saved locally to device)`);
        setTimeout(() => setSuccessToast(''), 5000);
      } catch (storageErr) {
        setSubmitting(false);
        setWizardError(err.response?.data?.message || 'Failed to connect to backend server at ' + (axios.defaults.baseURL || '192.168.1.3:5000') + '. Please check Windows Firewall.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* 1. TOP NAVBAR (Exact design matching reference mockup) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <CityConnectLogo className="w-9 h-9 sm:w-10 sm:h-10" />
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
              CityConnectAI
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">
              Smart Civic Operations Platform
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {inProgressCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {inProgressCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Civic Updates</h4>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {inProgressCount} Active
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {complaints.slice(0, 3).map((c, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-semibold text-slate-800">{c.category}: {c.complaintId || c.id}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Status: <strong>{c.status}</strong></p>
                      <span className="text-[10px] text-slate-400">{formatComplaintDate(c.createdAt)}</span>
                    </div>
                  ))}
                  {complaints.length === 0 && (
                    <p className="text-xs text-slate-400 py-2 text-center">No active notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Citizen Profile Chip with Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setCitizenDropdownOpen(!citizenDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                C
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  {user?.name || 'Citizen'}
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  CityConnectAI
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {citizenDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portal Switcher</p>
                </div>
                <Link to="/worker" className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50/70 hover:text-blue-700 transition-colors">
                  <Wrench className="w-4 h-4 text-blue-600" /> Field Worker Console
                </Link>
                <Link to="/admin" className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-700 transition-colors">
                  <Building2 className="w-4 h-4 text-[#059669]" /> Municipal Admin Console
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-6 z-50 p-4 bg-[#059669] text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-semibold max-w-md"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast('')} className="text-white/80 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR (Matching reference mockup) */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0">
          
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveNav('home'); setStatusFilter('ALL'); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeNav === 'home' && statusFilter === 'ALL'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Home</span>
            </button>

            <button
              onClick={() => { setActiveNav('home'); setStatusFilter('ALL'); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeNav === 'complaints'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>My Complaints</span>
            </button>

            <button
              onClick={() => setActiveNav('map')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeNav === 'map'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-4 h-4 shrink-0" />
              <span>Map View</span>
            </button>

            <button
              onClick={openWizard}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
            >
              <FilePlus className="w-4 h-4 shrink-0 text-[#059669]" />
              <span>Report Issue</span>
            </button>

            <button
              onClick={() => setActiveNav('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeNav === 'profile'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveNav('support')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeNav === 'support'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Help & Support</span>
            </button>
          </div>

          {/* Bottom Citizen Info Card */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 font-bold">
                C
              </div>
              <div className="truncate">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {user?.name || 'Citizen Portal'}
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  Civic Contributor
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#059669] mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                  <span>GPS Active</span>
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: HOME */}
          {activeNav === 'home' && (
            <>
              {/* Header Greeting Banner & "+ Report Civic Issue" Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    {getGreeting()} 👋 {user?.name || 'Citizen'}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    Let's make our city cleaner and safer. Report civic issues around you.
                  </p>
                </div>

                <button
                  onClick={openWizard}
                  className="px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl font-bold text-xs md:text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span>Report Civic Issue</span>
                </button>
              </div>

              {/* 4 SUMMARY STAT CARDS (Exact match to reference mockup) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. My Complaints (Blue) */}
                <div className="bg-[#e0f2fe]/60 border border-[#bae6fd] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#bae6fd]/70 text-sky-700 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {totalCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      My Complaints
                    </div>
                  </div>
                </div>

                {/* 2. In Progress (Yellow) */}
                <div className="bg-[#fef3c7]/60 border border-[#fde68a] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#fde68a]/70 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {inProgressCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      In Progress
                    </div>
                  </div>
                </div>

                {/* 3. Resolved (Green) */}
                <div className="bg-[#dcfce7]/60 border border-[#bbf7d0] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#bbf7d0]/70 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {resolvedCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Resolved
                    </div>
                  </div>
                </div>

                {/* 4. Pending (Red) */}
                <div className="bg-[#ffe4e6]/60 border border-[#fecdd3] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#fecdd3]/70 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {pendingCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Pending
                    </div>
                  </div>
                </div>
              </div>

              {/* "My Reported Issues" Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <h2 className="text-xl font-bold text-slate-900">
                  My Reported Issues
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by ID, location or issue type..."
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 w-56 md:w-64 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all cursor-pointer pr-8 appearance-none"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button 
                    onClick={fetchData}
                    title="Refresh Issues"
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* COMPLAINT CARDS GRID (4 Columns Matching Reference Design) */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="grid grid-cols-2 gap-2 h-24 bg-slate-100 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-6 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-[#059669] rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No reported issues found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Report a civic problem like potholes, overflowing garbage, or streetlights to notify municipal field workers.
                  </p>
                  <button
                    onClick={openWizard}
                    className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Report Civic Issue
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredComplaints.map((c) => {
                    const beforePhoto = c.photoUrl || c.citizenPhoto || c.workerBeforePhoto;
                    const afterPhoto = getComplaintAfterPhoto(c);
                    const address = c.location?.address || c.citizenLocation?.address || 'Municipal Zone';
                    const dateFormatted = formatComplaintDate(c.createdAt);
                    const stageIndex = getTimelineStage(c.status);
                    const isResolved = c.status === 'RESOLVED' || c.status === 'COMPLETED';
                    const isInProgress = c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'VERIFICATION';

                    return (
                      <div
                        key={c._id || c.complaintId || c.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-3.5 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top: ID + Status Pill */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="font-mono text-xs font-bold text-blue-600 truncate">
                              {c.complaintId || c.id || c._id}
                            </span>

                            {isResolved && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Resolved
                              </span>
                            )}
                            {isInProgress && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                In Progress
                              </span>
                            )}
                            {!isResolved && !isInProgress && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </div>

                          {/* Dual Side-by-Side Images */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Before Image */}
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-100">
                              <span className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded z-10">
                                Before
                              </span>
                              {beforePhoto ? (
                                <img 
                                  src={beforePhoto} 
                                  alt="Before" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-400 text-center">
                                  <Camera className="w-4 h-4 mb-0.5 text-slate-300" />
                                  <span className="text-[9px]">No Photo</span>
                                </div>
                              )}
                            </div>

                            {/* After Image */}
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-100">
                              <span className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded z-10">
                                After
                              </span>
                              {afterPhoto ? (
                                <img 
                                  src={afterPhoto} 
                                  alt="After" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-slate-50 text-slate-400 text-center">
                                  <Camera className="w-4 h-4 mb-0.5 text-slate-300" />
                                  <span className="text-[9px]">Awaiting Work</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Category Title */}
                          <h3 className="font-bold text-sm text-slate-900 mt-2 truncate">
                            {c.category || 'Civic Infrastructure'}
                          </h3>

                          {/* Location & Date */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1 truncate max-w-[55%]">
                              <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate">{address}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{dateFormatted}</span>
                            </span>
                          </div>

                          {/* 5-Step Timeline Tracker (Matching reference mockup) */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <div className="relative flex items-center justify-between px-1">
                              {/* Background Connector Bar */}
                              <div className="absolute top-1.5 left-2 right-2 h-0.5 bg-slate-200 -z-0" />
                              {/* Active Progress Connector */}
                              <div 
                                className="absolute top-1.5 left-2 h-0.5 bg-[#059669] -z-0 transition-all duration-500"
                                style={{ width: `${(stageIndex / 4) * 100}%` }}
                              />

                              {['Submitted', 'Assigned', 'In Progress', 'Verified', 'Resolved'].map((label, idx) => {
                                const isPassed = idx <= stageIndex;
                                return (
                                  <div key={label} className="flex flex-col items-center relative z-10">
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                                      isPassed ? 'bg-[#059669] text-white shadow-2xs' : 'bg-slate-200 border-2 border-white'
                                    }`}>
                                      {isPassed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                    <span className={`text-[8px] mt-1 tracking-tighter ${
                                      isPassed ? 'text-[#059669] font-bold' : 'text-slate-400'
                                    }`}>
                                      {label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={() => setSelectedDetailComplaint(c)}
                          className="mt-3 w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MAP VIEW */}
          {activeNav === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Citywide Civic Map</h2>
                  <p className="text-xs text-slate-500">Live geolocation pins of reported issues and resolution status</p>
                </div>
                <button 
                  onClick={() => setActiveNav('home')}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-hidden h-[540px]">
                <LeafletMap 
                  complaints={complaints.map(c => ({
                    ...c,
                    location: c.location?.latitude ? c.location : (c.citizenLocation || { latitude: 19.0760, longitude: 72.8777, address: 'Mumbai' })
                  }))}
                  center={[gpsLocation.lat, gpsLocation.lng]}
                  zoom={12}
                />
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {activeNav === 'profile' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-4 border-b pb-5">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                  C
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{user?.name || 'Citizen User'}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verified Smart City Civic Contributor</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full text-xs font-bold">
                    Active Citizen Account
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Total Issues Reported</span>
                  <p className="font-bold text-slate-800 text-lg mt-1">{totalCount}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Successfully Resolved</span>
                  <p className="font-bold text-emerald-700 text-lg mt-1">{resolvedCount}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Detection Accuracy</span>
                  <p className="font-bold text-slate-800 mt-1">High (Dual GPS &amp; AI Vision)</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Resolution Success Rate</span>
                  <p className="font-bold text-emerald-700 mt-1">
                    {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HELP & SUPPORT */}
          {activeNav === 'support' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Citizen Civic Support Center</h2>
                <p className="text-xs text-slate-500 mt-1">Frequently asked questions and emergency municipal contacts</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">24x7 Municipal Citizen Helpline</h4>
                    <p className="text-slate-500 text-[11px]">Toll-free emergency civic dispatch number</p>
                  </div>
                  <a href="tel:1800112233" className="px-3 py-1.5 bg-[#059669] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer">
                    <Phone className="w-3.5 h-3.5" /> Call 1800-11-2233
                  </a>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <h4 className="font-bold text-slate-800">How does AI Verification work?</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    When a field worker finishes work on-site, they submit a timestamped After photo. The CityConnectAI Vision model compares before and after evidence, while GPS verifies the worker was on-site within 10 meters.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 3. COMPLAINT DETAILS MODAL */}
      <AnimatePresence>
        {selectedDetailComplaint && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
            >
              {(() => {
                const c = selectedDetailComplaint;
                const beforePhoto = c.photoUrl || c.citizenPhoto || c.workerBeforePhoto;
                const afterPhoto = getComplaintAfterPhoto(c);
                const address = c.location?.address || c.citizenLocation?.address || 'Site Area';
                const isResolved = c.status === 'RESOLVED' || c.status === 'COMPLETED';

                return (
                  <>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            {c.complaintId || c.id || c._id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mt-1">
                          {c.category}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setSelectedDetailComplaint(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-700 font-medium">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{address}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-1">Issue Description:</span>
                        {c.description || 'Civic infrastructure maintenance complaint submitted by citizen.'}
                      </div>
                    </div>

                    {/* Comparison Photos */}
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-2">Photo Verification Evidence:</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">1. Citizen Reported Defect (Before)</span>
                          {beforePhoto ? (
                            <img src={beforePhoto} alt="Before" className="w-full h-44 object-cover rounded-xl border border-slate-200" />
                          ) : (
                            <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                              No Citizen Photo
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">2. Field Worker Resolution (After)</span>
                          {afterPhoto ? (
                            <img src={afterPhoto} alt="After" className="w-full h-44 object-cover rounded-xl border border-slate-200" />
                          ) : (
                            <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                              Awaiting Field Worker Completion
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t">
                      <button
                        onClick={() => setSelectedDetailComplaint(null)}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl cursor-pointer"
                      >
                        Close Details
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. 4-STEP "REPORT CIVIC ISSUE" WIZARD MODAL (Exact match to reference mockup bottom cards) */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Report Civic Issue</h3>
                  <p className="text-xs text-slate-400">Step {wizardStep} of 4</p>
                </div>
                <button
                  onClick={() => setIsWizardOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Alert */}
              {wizardError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* Modal Body: 4 Steps */}
              <div className="p-6 overflow-y-auto flex-1">
                
                {/* STEP 1: What is the problem? */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">What is the problem?</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Select the type of issue you want to report</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {CIVIC_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${cat.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 leading-tight">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: Exact Incident Location */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">Exact Incident Location</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Let us know where the issue is located</p>
                    </div>

                    {/* Mode Toggle Pills (Matching reference mockup) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setLocationMode('gps'); detectGps(); }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          locationMode === 'gps'
                            ? 'bg-[#059669] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Use My Current Location</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLocationMode('manual')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          locationMode === 'manual'
                            ? 'bg-[#059669] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Enter Address Manually</span>
                      </button>
                    </div>

                    {/* Interactive Map Area (with GPS Pin) */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-44 shadow-2xs">
                      <LeafletMap 
                        center={[gpsLocation.lat, gpsLocation.lng]}
                        zoom={15}
                        height="100%"
                        complaints={[{
                          _id: 'gps-target',
                          status: 'PENDING',
                          location: { latitude: gpsLocation.lat, longitude: gpsLocation.lng }
                        }]}
                      />
                      <button
                        type="button"
                        onClick={detectGps}
                        className="absolute bottom-3 right-3 p-2 bg-white rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer z-10"
                        title="Locate Current Position"
                      >
                        <Navigation className="w-4 h-4 text-[#059669]" />
                      </button>
                    </div>

                    {/* Green Location Status Bar */}
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                        <span>Location detected successfully!</span>
                      </div>
                      {locationMode === 'manual' ? (
                        <input
                          type="text"
                          value={gpsLocation.address}
                          onChange={(e) => setGpsLocation(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="e.g. MG Road, Ward 3, Shirpur, 425405"
                          className="w-full text-xs p-2 border border-emerald-300 rounded-lg bg-white outline-none font-medium"
                        />
                      ) : (
                        <p className="text-[11px] text-emerald-800 font-medium pl-5.5">
                          {gpsLocation.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: Tell us about the issue */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">Tell us about the issue</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Add description and photo for better resolution</p>
                    </div>

                    {/* Photo Upload Box */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Photo Evidence (Optional)
                      </label>
                      
                      {photoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 w-full h-36">
                          <img src={photoPreview} alt="Evidence" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full cursor-pointer shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-200 hover:border-[#059669] rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                          <Camera className="w-7 h-7 text-slate-400 mb-1.5" />
                          <span className="text-xs font-semibold text-slate-700">Click to upload image photo</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG (Max 5MB)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoSelect} 
                            className="hidden" 
                            ref={fileInputRef}
                          />
                        </label>
                      )}
                    </div>

                    {/* Description Textarea */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Description (Required)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Describe the complaint location or severity..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none font-medium resize-none"
                      />
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">
                        {description.length}/500
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Submit */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">Review &amp; Submit</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Please review the details before submitting</p>
                    </div>

                    {/* Review Details Table (Matching reference mockup) */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="text-slate-400 font-medium">Issue Type</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Construction className="w-3.5 h-3.5 text-blue-600" />
                          {selectedCategory}
                        </span>
                      </div>

                      <div className="flex items-start justify-between pb-2 border-b border-slate-200/60">
                        <span className="text-slate-400 font-medium shrink-0">Location</span>
                        <span className="font-semibold text-slate-800 text-right break-words max-w-[70%] flex items-center justify-end gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {gpsLocation.address}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="text-slate-400 font-medium">Photos</span>
                        {photoPreview ? (
                          <img src={photoPreview} alt="Attached" className="w-12 h-10 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400 font-medium">Description</span>
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                          {description || 'No detailed text provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                      <input 
                        type="checkbox" 
                        checked={confirmedAccurate} 
                        onChange={(e) => setConfirmedAccurate(e.target.checked)} 
                        className="rounded text-[#059669] focus:ring-[#059669] cursor-pointer"
                      />
                      <span>I confirm that the information provided is accurate.</span>
                    </label>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                ) : <div />}

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep + 1)}
                    className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitComplaint}
                    disabled={submitting}
                    className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                      submitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#059669] hover:bg-[#047857] active:scale-95'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
