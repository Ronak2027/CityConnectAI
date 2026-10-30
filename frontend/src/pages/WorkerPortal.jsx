import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Bell, ChevronDown, ClipboardList, MapPin, 
  CheckSquare, User, HelpCircle, HardHat, Search, Clock, 
  AlertCircle, CheckCircle2, Eye, Camera, X, RefreshCw, 
  Map as MapIcon, Phone, ShieldCheck, Wrench, Calendar,
  ExternalLink, Check, Navigation, AlertTriangle, Layers,
  CheckCircle, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { reverseGeocode } from '../utils/geocoding';
import LeafletMap from '../components/LeafletMap';
import CityConnectLogo from '../components/CityConnectLogo';

// Predefined official municipal field workers fallback (if /api/auth/workers fails)
const FALLBACK_WORKERS = [
  {
    id: 'WRK-202',
    _id: 'WRK-202',
    name: 'Suresh Kumar',
    role: 'Field Worker',
    phone: '+91 98202 23456',
    status: 'ON_DUTY',
    avatar: 'SK',
    ward: 'Ward 5 - Wadala East',
    department: 'Drainage & Civic Works',
    rating: 4.9
  },
  {
    id: 'WRK-201',
    _id: 'WRK-201',
    name: 'Ramesh Shinde',
    role: 'Sanitation Lead',
    phone: '+91 98201 12345',
    status: 'ON_DUTY',
    avatar: 'RS',
    ward: 'Ward 4 - Central Zone',
    department: 'Waste Management',
    rating: 4.8
  },
  {
    id: 'WRK-203',
    _id: 'WRK-203',
    name: 'Amit Patel',
    role: 'Electrical Worker',
    phone: '+91 98203 34567',
    status: 'ON_DUTY',
    avatar: 'AP',
    ward: 'Ward 3 - Prabhadevi',
    department: 'Streetlight & Grid',
    rating: 4.7
  }
];

export default function WorkerPortal() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Navigation Sidebar Tab ('tasks' | 'map' | 'completed' | 'profile' | 'support')
  const [activeNav, setActiveNav] = useState('tasks');

  // Workers & Selected Worker
  const [workers, setWorkers] = useState(FALLBACK_WORKERS);
  const [selectedWorkerId, setSelectedWorkerId] = useState(() => {
    return localStorage.getItem('clean_city_selected_worker') || 'WRK-202';
  });

  // Real database tasks only (no dummy data)
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'RESOLVED'

  // Modals & Popovers
  const [selectedDetailTask, setSelectedDetailTask] = useState(null);
  const [cameraTask, setCameraTask] = useState(null);
  const [cameraMode, setCameraMode] = useState(null); // 'BEFORE' | 'COMPLETE' | null
  const [workerDropdownOpen, setWorkerDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Image Upload State
  const [capturedImage, setCapturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Live Geolocation
  const [workerGps, setWorkerGps] = useState({ lat: null, lng: null, address: '' });

  const afterInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Helper to get active worker profile
  const activeWorker = workers.find(w => (w.id === selectedWorkerId || w._id === selectedWorkerId)) || workers[0] || {
    id: selectedWorkerId,
    name: 'Field Worker',
    role: 'Field Worker',
    avatar: 'WK',
    phone: '+91 98202 23456'
  };

  const handleSelectWorker = (wId) => {
    setSelectedWorkerId(wId);
    localStorage.setItem('clean_city_selected_worker', wId);
    setWorkerDropdownOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setWorkerDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real workers from database
  const fetchWorkers = async () => {
    try {
      const res = await axios.get('/api/auth/workers');
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(w => {
          const fallback = FALLBACK_WORKERS.find(fw => fw.id === (w.id || w._id)) || {};
          const initials = (w.name || 'Worker').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return {
            ...fallback,
            ...w,
            id: w.id || w._id || fallback.id,
            _id: w._id || w.id || fallback._id,
            name: w.name || fallback.name,
            phone: w.phone || fallback.phone || '+91 98202 23456',
            role: w.department || w.role || fallback.role || 'Field Worker',
            ward: w.zone || fallback.ward || 'Municipal Zone',
            avatar: fallback.avatar || initials,
            status: w.status || 'ON_DUTY',
            rating: w.rating || 4.9
          };
        });
        setWorkers(mapped);
      }
    } catch (err) {
      console.warn("Workers API fallback used", err);
    }
  };

  // Fetch real tasks from database (NO dummy tasks)
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.warn("Failed to fetch real tasks", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchTasks();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await reverseGeocode(lat, lng);
          setWorkerGps({ lat, lng, address });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Socket updates for live task dispatch & verification
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTasks();
    socket.on('task:updated', handleUpdate);
    socket.on('task:assigned', handleUpdate);
    socket.on('verification.approved', handleUpdate);
    socket.on('verification.rejected', handleUpdate);
    socket.on('complaint:updated', handleUpdate);

    return () => {
      socket.off('task:updated', handleUpdate);
      socket.off('task:assigned', handleUpdate);
      socket.off('verification.approved', handleUpdate);
      socket.off('verification.rejected', handleUpdate);
      socket.off('complaint:updated', handleUpdate);
    };
  }, [socket]);

  // Match tasks to the active worker accurately
  const isTaskForActiveWorker = (task, wId) => {
    if (wId === 'ALL') return true;
    const tWorkerId = typeof task.workerId === 'object' ? (task.workerId?.id || task.workerId?._id) : task.workerId;
    const cWorkerId = typeof task.complaintId === 'object' ? task.complaintId?.assignedWorkerId : null;
    const taskWorkerObjId = task.worker?.id || task.worker?._id;
    
    if (tWorkerId === wId || cWorkerId === wId || taskWorkerObjId === wId) return true;

    const currentW = workers.find(w => w.id === wId || w._id === wId);
    if (currentW) {
      const taskWorkerName = task.worker?.name || (typeof task.assignedWorkerId === 'object' ? task.assignedWorkerId?.name : task.assignedWorkerId);
      if (taskWorkerName && taskWorkerName.toLowerCase().includes(currentW.name.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  // Filter tasks for selected worker
  const workerTasks = tasks.filter(t => isTaskForActiveWorker(t, selectedWorkerId));

  // Search & Status filters
  const filteredTasks = workerTasks.filter(t => {
    // Status Filter
    if (statusFilter === 'PENDING') {
      if (t.status !== 'ASSIGNED' && t.status !== 'PENDING' && t.status !== 'IN_PROGRESS') return false;
    } else if (statusFilter === 'VERIFIED') {
      if (t.status !== 'VERIFICATION') return false;
    } else if (statusFilter === 'RESOLVED') {
      if (t.status !== 'RESOLVED' && t.status !== 'COMPLETED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const complaint = t.complaintId || t.complaint || {};
      const matchId = (t.taskId || t._id || '').toLowerCase().includes(q);
      const matchLoc = (t.location?.address || complaint.location?.address || '').toLowerCase().includes(q);
      const matchCat = (complaint.category || t.category || '').toLowerCase().includes(q);
      const matchDesc = (complaint.description || t.description || '').toLowerCase().includes(q);
      if (!matchId && !matchLoc && !matchCat && !matchDesc) return false;
    }
    return true;
  });

  // Dynamic metric calculations from real data
  const totalTasksCount = workerTasks.length;
  const inProgressCount = workerTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pendingCount = workerTasks.filter(t => t.status === 'ASSIGNED' || t.status === 'PENDING').length;
  const completedCount = workerTasks.filter(t => t.status === 'RESOLVED' || t.status === 'COMPLETED' || t.status === 'VERIFICATION').length;

  // Format date helper
  const formatTaskDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Render Priority Pill
  const renderPriorityBadge = (priority) => {
    const p = (priority || 'Medium').toLowerCase();
    if (p === 'critical' || p === 'high') {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          {priority || 'High'}
        </span>
      );
    }
    if (p === 'low') {
      return (
        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Low
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
        {priority || 'Medium'}
      </span>
    );
  };

  // Fast client-side image compression
  const compressImage = (file, maxWidth = 1280, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            const compressed = new File([blob], (file.name || 'photo').replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressed);
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleAfterFileSelected = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const optimized = await compressImage(file);
      setCapturedImage(optimized);
      setImagePreview(URL.createObjectURL(optimized));
    }
  };

  const handleBeforeFileSelected = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const optimized = await compressImage(file);
      setBeforeFile(optimized);
      setBeforePreview(URL.createObjectURL(optimized));
    }
  };

  // Submit Work Photo to Backend
  const handleSubmitWorkPhoto = async () => {
    if (!capturedImage) {
      setErrorMsg("Please capture or choose an after-work photo first.");
      return;
    }
    setUploading(true);
    setErrorMsg('');
    try {
      const targetId = cameraTask._id || cameraTask.id || cameraTask.taskId;
      let lat = workerGps.lat || cameraTask.location?.latitude || 19.0234;
      let lng = workerGps.lng || cameraTask.location?.longitude || 72.8571;
      let address = workerGps.address || cameraTask.location?.address || '';

      const formData = new FormData();
      formData.append('afterImage', capturedImage);
      if (beforeFile) {
        formData.append('beforeImage', beforeFile);
      } else {
        const existingBefore = beforePreview || cameraTask?.beforeImage || cameraTask?.complaintId?.photoUrl;
        if (existingBefore) formData.append('beforeImage', existingBefore);
      }
      formData.append('workerId', activeWorker.id || activeWorker._id);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('workerAddress', address);
      formData.append('timestamp', new Date().toISOString());

      const res = await axios.post(`/api/tasks/${targetId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const savedAfter = res.data?.verification?.afterImage || imagePreview;
      const savedBefore = res.data?.verification?.beforeImage || beforePreview;

      setTasks(prev => prev.map(t => (t._id === targetId || t.taskId === targetId)
        ? { ...t, status: 'VERIFICATION', afterImage: savedAfter, beforeImage: savedBefore || t.beforeImage }
        : t
      ));

      setUploading(false);
      setCameraTask(null);
      setCameraMode(null);
      setCapturedImage(null);
      setImagePreview(null);
      setBeforeFile(null);
      setBeforePreview(null);
      setSuccessToast(`Completion proof for task ${cameraTask.taskId || targetId} submitted successfully!`);
      setTimeout(() => setSuccessToast(''), 5000);
      fetchTasks();
    } catch (err) {
      setUploading(false);
      setErrorMsg(err.response?.data?.message || 'Error submitting work evidence.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* 1. TOP NAVBAR */}
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
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Field Operations Alerts</h4>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {pendingCount} Pending
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {workerTasks.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-semibold text-slate-800">
                        {t.status === 'COMPLETED' ? 'Task Verified' : 'Work Order Assigned'}: {t.taskId}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {t.complaintId?.category || t.category || 'Civic Infrastructure'} • {t.location?.address || 'Site Area'}
                      </p>
                      <span className="text-[10px] text-slate-400">{formatTaskDate(t.createdAt)}</span>
                    </div>
                  ))}
                  {workerTasks.length === 0 && (
                    <p className="text-xs text-slate-400 py-2 text-center">No active notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Worker Profile Chip with Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setWorkerDropdownOpen(!workerDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {activeWorker.avatar || 'SK'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  {activeWorker.name}
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  {activeWorker.role || 'Field Worker'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Worker Switcher & Portal Links Dropdown */}
            {workerDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Field Worker</p>
                </div>
                {workers.map(w => (
                  <button
                    key={w.id || w._id}
                    onClick={() => handleSelectWorker(w.id || w._id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      (selectedWorkerId === w.id || selectedWorkerId === w._id) 
                        ? 'bg-emerald-50 text-[#059669] font-bold' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {w.avatar}
                      </span>
                      <span>{w.name} ({w.id || w._id})</span>
                    </div>
                    {(selectedWorkerId === w.id || selectedWorkerId === w._id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => handleSelectWorker('ALL')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedWorkerId === 'ALL' ? 'bg-emerald-50 text-[#059669] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
                      ALL
                    </span>
                    <span>All Workers (Citywide Master Queue)</span>
                  </div>
                  {selectedWorkerId === 'ALL' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                  <Link to="/citizen" className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-xl transition-colors">
                    <User className="w-3.5 h-3.5" /> Citizen Portal
                  </Link>
                  <Link to="/admin" className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-colors">
                    <Building2 className="w-3.5 h-3.5" /> Municipal Admin Console
                  </Link>
                </div>
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
            <button onClick={() => setSuccessToast('')} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0">
          
          {/* Menu Items */}
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveNav('tasks'); setStatusFilter('ALL'); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeNav === 'tasks' && statusFilter !== 'RESOLVED'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>My Tasks</span>
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
              onClick={() => { setActiveNav('tasks'); setStatusFilter('RESOLVED'); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeNav === 'tasks' && statusFilter === 'RESOLVED'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span>Completed Tasks</span>
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

          {/* Bottom Worker Status Card */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
                <HardHat className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {activeWorker.name}
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  {activeWorker.id || activeWorker._id}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#059669] mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: MY TASKS */}
          {activeNav === 'tasks' && (
            <>
              {/* Header Row: Title & Subtitle + Search & Filter Pills */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    My Assigned Tasks
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {totalTasksCount} task{totalTasksCount === 1 ? '' : 's'} assigned • Complete field work and upload proof
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by ID or location..."
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 w-56 md:w-64 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                    {['ALL', 'PENDING', 'VERIFIED', 'RESOLVED'].map((filterKey) => (
                      <button
                        key={filterKey}
                        onClick={() => setStatusFilter(filterKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          statusFilter === filterKey
                            ? 'bg-[#059669] text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {filterKey === 'ALL' ? 'All' : filterKey.charAt(0) + filterKey.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={fetchTasks}
                    title="Refresh Feed"
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 STAT SUMMARY CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Tasks (Blue) */}
                <div className="bg-[#e0f2fe]/60 border border-[#bae6fd] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#bae6fd]/70 text-sky-700 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {totalTasksCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Total Tasks
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

                {/* 3. Pending (Rose) */}
                <div className="bg-[#ffe4e6]/60 border border-[#fecdd3] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#fecdd3]/70 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
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

                {/* 4. Completed (Green) */}
                <div className="bg-[#dcfce7]/60 border border-[#bbf7d0] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#bbf7d0]/70 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {completedCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Completed
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-COLUMN TASK CARDS GRID */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                      <div className="h-5 bg-slate-200 rounded w-1/2" />
                      <div className="grid grid-cols-2 gap-2 h-28 bg-slate-100 rounded-xl" />
                      <div className="grid grid-cols-2 gap-2 h-8" />
                    </div>
                  ))}
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    No tasks assigned to {selectedWorkerId === 'ALL' ? 'field operators' : activeWorker.name}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    To assign tasks to {activeWorker.name}, visit the <strong>Municipal Admin Console &gt; Complaints Register</strong>, select a complaint, and dispatch it to this worker.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    {selectedWorkerId !== 'ALL' && (
                      <button
                        onClick={() => handleSelectWorker('ALL')}
                        className="px-4 py-2 bg-[#059669] text-white text-xs font-semibold rounded-xl hover:bg-[#047857] transition-all cursor-pointer"
                      >
                        View All Citywide Tasks
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTasks.map((task) => {
                    const complaint = task.complaintId || task.complaint || {};
                    const beforePhoto = task.beforeImage || complaint.photoUrl;
                    const afterPhoto = task.afterImage;
                    const taskTitle = complaint.category || task.category || 'Civic Infrastructure';
                    const locationAddress = task.location?.address || complaint.location?.address || 'Municipal Zone';
                    const taskDate = formatTaskDate(task.createdAt || complaint.createdAt);
                    const isCompleted = task.status === 'RESOLVED' || task.status === 'COMPLETED';

                    return (
                      <div
                        key={task._id || task.taskId}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: ID + Priority Pill + Date */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-blue-600 font-bold text-xs tracking-tight">
                              {task.taskId || task._id}
                            </span>

                            <div className="flex items-center gap-2">
                              {renderPriorityBadge(task.priority || complaint.priority)}

                              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {taskDate}
                              </span>
                            </div>
                          </div>

                          {/* Location Pin & Address */}
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{locationAddress}</span>
                          </div>

                          {/* Task Title */}
                          <h3 className="font-bold text-base text-slate-900 mt-1 truncate">
                            {taskTitle}
                          </h3>

                          {/* DUAL BEFORE & AFTER IMAGES */}
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {/* Before Image */}
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
                              <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md z-10">
                                Before
                              </span>
                              {beforePhoto ? (
                                <img 
                                  src={beforePhoto} 
                                  alt="Before condition" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400 text-center">
                                  <Camera className="w-5 h-5 mb-1 text-slate-300" />
                                  <span className="text-[10px] font-medium text-slate-500">No Photo</span>
                                </div>
                              )}
                            </div>

                            {/* After Image */}
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
                              <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md z-10">
                                After
                              </span>
                              {afterPhoto ? (
                                <img 
                                  src={afterPhoto} 
                                  alt="After work" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-2 text-center">
                                  <Camera className="w-5 h-5 mb-1 text-slate-300" />
                                  <span className="text-[10px] font-medium text-slate-500">Awaiting Upload</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* CARD BOTTOM ACTION BUTTONS */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
                          <button
                            onClick={() => setSelectedDetailTask(task)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>

                          <button
                            onClick={() => {
                              setCameraTask(task);
                              setCameraMode('COMPLETE');
                              setCapturedImage(null);
                              setImagePreview(null);
                              setBeforeFile(null);
                              setBeforePreview(beforePhoto);
                              setErrorMsg('');
                            }}
                            className={`text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                              isCompleted 
                                ? 'bg-emerald-700 hover:bg-emerald-800' 
                                : 'bg-[#059669] hover:bg-[#047857]'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {isCompleted ? 'Update Proof' : 'Upload Completion'}
                          </button>
                        </div>
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
                  <h2 className="text-xl font-bold text-slate-900">Field GIS Map View</h2>
                  <p className="text-xs text-slate-500">Geospatial location pins for tasks assigned to {activeWorker.name}</p>
                </div>
                <button 
                  onClick={() => setActiveNav('tasks')}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back to Grid
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-hidden h-[540px]">
                <LeafletMap 
                  tasks={workerTasks.map(t => {
                    const complaint = t.complaintId || t.complaint || {};
                    return {
                      ...t,
                      location: t.location?.latitude ? t.location : (complaint.location?.latitude ? complaint.location : { latitude: 19.0234, longitude: 72.8571, address: 'Mumbai' })
                    };
                  })}
                  center={[workerGps.lat || 19.0234, workerGps.lng || 72.8571]}
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
                  {activeWorker.avatar || 'SK'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{activeWorker.name}</h2>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full text-xs font-bold">
                      {activeWorker.status || 'ON_DUTY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Operator ID: {activeWorker.id || activeWorker._id} • {activeWorker.role || 'Field Worker'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Assigned Zone</span>
                  <p className="font-bold text-slate-800 mt-1">{activeWorker.ward || 'Municipal Field Zone'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Department</span>
                  <p className="font-bold text-slate-800 mt-1">{activeWorker.department || 'Civic Operations'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Contact Phone</span>
                  <p className="font-bold text-slate-800 mt-1">{activeWorker.phone}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Field Rating</span>
                  <p className="font-bold text-emerald-700 mt-1">{activeWorker.rating || 4.9} / 5.0 ⭐</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs">Field Verification Protocol</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Dual AI Vision inspection &amp; GPS geofence validation active.</p>
                </div>
                <ShieldCheck className="w-6 h-6 text-[#059669]" />
              </div>
            </div>
          )}

          {/* TAB 4: HELP & SUPPORT */}
          {activeNav === 'support' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Municipal Field Operations Support</h2>
                <p className="text-xs text-slate-500 mt-1">24/7 supervisor dispatch and field assistance</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Ward Central Dispatch Control</h4>
                    <p className="text-slate-500 text-[11px]">Direct emergency radio &amp; telephone bridge</p>
                  </div>
                  <a href="tel:1800112233" className="px-3 py-1.5 bg-[#059669] text-white rounded-lg font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Call Hotline
                  </a>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Field Equipment &amp; Vehicle Request</h4>
                    <p className="text-slate-500 text-[11px]">Asphalt mixer, suction tanker, ladder van</p>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">
                    Request Dispatch
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 3. TASK DETAILS MODAL */}
      <AnimatePresence>
        {selectedDetailTask && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
            >
              {(() => {
                const complaint = selectedDetailTask.complaintId || selectedDetailTask.complaint || {};
                const beforePhoto = selectedDetailTask.beforeImage || complaint.photoUrl;
                const afterPhoto = selectedDetailTask.afterImage;
                const address = selectedDetailTask.location?.address || complaint.location?.address || 'Site Area';
                const description = complaint.description || selectedDetailTask.description || 'Civic infrastructure repair work order.';

                return (
                  <>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            {selectedDetailTask.taskId || selectedDetailTask._id}
                          </span>
                          {renderPriorityBadge(selectedDetailTask.priority || complaint.priority)}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mt-1">
                          {complaint.category || selectedDetailTask.category || 'Civic Infrastructure Repair'}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setSelectedDetailTask(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Location & Details */}
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-700 font-medium">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{address}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-1">Work Description & Scope:</span>
                        {description}
                      </div>
                    </div>

                    {/* Comparison Photos */}
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-2">Evidence Photo Comparison:</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">1. Initial Defect (Before)</span>
                          {beforePhoto ? (
                            <img 
                              src={beforePhoto} 
                              alt="Before" 
                              className="w-full h-44 object-cover rounded-xl border border-slate-200" 
                            />
                          ) : (
                            <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                              No Before Photo
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">2. Completion Resolution (After)</span>
                          {afterPhoto ? (
                            <img 
                              src={afterPhoto} 
                              alt="After" 
                              className="w-full h-44 object-cover rounded-xl border border-slate-200" 
                            />
                          ) : (
                            <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                              Awaiting Resolution Photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t">
                      <button
                        onClick={() => setSelectedDetailTask(null)}
                        className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          const t = selectedDetailTask;
                          setSelectedDetailTask(null);
                          setCameraTask(t);
                          setCameraMode('COMPLETE');
                          setCapturedImage(null);
                          setImagePreview(null);
                          setBeforePreview(beforePhoto);
                        }}
                        className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Upload Completion
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. UPLOAD WORK EVIDENCE MODAL */}
      <AnimatePresence>
        {cameraMode && cameraTask && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Upload Completion Proof
                  </h3>
                  <p className="text-xs text-slate-500">
                    Task <strong className="text-blue-600">{cameraTask.taskId || cameraTask._id}</strong> • Field Worker: <strong className="text-slate-800">{activeWorker.name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCameraMode(null);
                    setCameraTask(null);
                    setCapturedImage(null);
                    setImagePreview(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                📷 <strong>Civic Field Operations Rule:</strong> Take or select a clear, high-resolution photograph of the resolved work on-site. The photo will be compared with the initial defect for instant AI verification.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Before Photo Preview */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">1. Initial Defect (Before)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      {beforePreview || cameraTask.beforeImage ? 'Attached' : 'Missing'}
                    </span>
                  </div>
                  {beforePreview || cameraTask.beforeImage ? (
                    <img 
                      src={beforePreview || cameraTask.beforeImage} 
                      alt="Before condition" 
                      className="w-full h-36 object-cover rounded-lg border border-slate-200" 
                    />
                  ) : (
                    <div className="w-full h-36 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[11px]">No before photo on record</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">Reference photo for visual comparison</p>
                </div>

                {/* 2. After Photo Capture */}
                <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900">2. Completion Photo (After) *</span>
                    {imagePreview ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Ready</span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Required</span>
                    )}
                  </div>

                  {imagePreview ? (
                    <div className="space-y-2">
                      <img 
                        src={imagePreview} 
                        alt="After work" 
                        className="w-full h-36 object-cover rounded-lg border border-emerald-300 shadow-xs" 
                      />
                      <button
                        type="button"
                        onClick={() => afterInputRef.current?.click()}
                        className="w-full py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div className="h-36 border-2 border-dashed border-emerald-300 rounded-lg flex flex-col items-center justify-center p-3 text-center space-y-2 bg-white/70">
                      <Camera className="w-6 h-6 text-emerald-600" />
                      <p className="text-xs text-emerald-950 font-semibold">Take or upload completion proof</p>
                      <button
                        type="button"
                        onClick={() => afterInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Capture Photo
                      </button>
                    </div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleAfterFileSelected} 
                    className="hidden" 
                    ref={afterInputRef} 
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  onClick={() => {
                    setCameraMode(null);
                    setCameraTask(null);
                    setCapturedImage(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitWorkPhoto}
                  disabled={uploading || !capturedImage}
                  className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                    !capturedImage || uploading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-[#059669] hover:bg-[#047857] active:scale-95 cursor-pointer'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {uploading ? 'Submitting & Verifying...' : 'Submit Completion Proof'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
