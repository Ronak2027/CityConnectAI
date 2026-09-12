import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, MapPin, Camera, CheckCircle2, AlertCircle, 
  Clock, Navigation, ShieldCheck, RefreshCw, X, User,
  Users, UserCheck, Wrench, Sparkles, ArrowRight, Phone,
  ExternalLink, Eye, Check
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { reverseGeocode } from '../utils/geocoding';

// Predefined official municipal field workers
const DEFAULT_WORKERS = [
  {
    id: 'WRK-201',
    _id: 'WRK-201',
    name: 'Ramesh Shinde',
    phone: '+91 98201 12345',
    status: 'ON_DUTY',
    avatar: 'RS',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-600',
    ringClass: 'ring-emerald-500',
    rating: 4.8
  },
  {
    id: 'WRK-202',
    _id: 'WRK-202',
    name: 'Suresh Kumar',
    phone: '+91 98202 23456',
    status: 'ON_DUTY',
    avatar: 'SK',
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-600',
    ringClass: 'ring-blue-500',
    rating: 4.9
  },
  {
    id: 'WRK-203',
    _id: 'WRK-203',
    name: 'Amit Patel',
    phone: '+91 98203 34567',
    status: 'ON_DUTY',
    avatar: 'AP',
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarBg: 'bg-purple-600',
    ringClass: 'ring-purple-500',
    rating: 4.7
  }
];

export default function WorkerPortal() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [workers, setWorkers] = useState(DEFAULT_WORKERS);
  const [selectedWorkerId, setSelectedWorkerId] = useState(() => {
    return localStorage.getItem('clean_city_selected_worker') || 'WRK-201';
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);

  // Field Operation State
  const [workerGps, setWorkerGps] = useState({ lat: null, lng: null, address: '' });

  // Camera Capture Modal State
  const [cameraMode, setCameraMode] = useState(null); // 'BEFORE' | 'COMPLETE' | null
  const [capturedImage, setCapturedImage] = useState(null); // after photo file
  const [imagePreview, setImagePreview] = useState(null);   // after photo preview
  const [beforeFile, setBeforeFile] = useState(null);       // worker before photo file
  const [beforePreview, setBeforePreview] = useState(null); // before photo preview
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const afterInputRef = useRef(null);
  const beforeInputRef = useRef(null);

  // Persist selected worker preference
  const handleSelectWorker = (wId) => {
    setSelectedWorkerId(wId);
    localStorage.setItem('clean_city_selected_worker', wId);
  };

  const fetchWorkers = async () => {
    try {
      const res = await axios.get('/api/auth/workers');
      if (res.data && res.data.length > 0) {
        // Merge with styling properties
        const merged = res.data.map((w, idx) => {
          const fallback = DEFAULT_WORKERS.find(dw => dw.id === (w.id || w._id)) || DEFAULT_WORKERS[idx % DEFAULT_WORKERS.length];
          return {
            ...fallback,
            ...w,
            id: w.id || w._id || fallback.id,
            _id: w.id || w._id || fallback._id,
            name: w.name || fallback.name,
            phone: w.phone || fallback.phone,
            avatar: fallback.avatar,
            color: fallback.color,
            badgeClass: fallback.badgeClass,
            avatarBg: fallback.avatarBg,
            ringClass: fallback.ringClass
          };
        });
        setWorkers(merged);
      }
    } catch (err) {
      console.warn("Using default worker profiles");
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.warn("Failed to load worker tasks");
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

  // Real-time socket sync: update tasks immediately when admin assigns or verifies
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

  // Active worker profile object
  const activeWorker = workers.find(w => w.id === selectedWorkerId || w._id === selectedWorkerId) || workers[0];

  // Helper to check if a task belongs to a worker
  const isTaskForWorker = (task, wId) => {
    if (wId === 'ALL') return true;
    const tWorkerId = typeof task.workerId === 'object' ? (task.workerId?.id || task.workerId?._id) : task.workerId;
    if (tWorkerId === wId || task.worker?.id === wId || task.worker?._id === wId) return true;

    const currentW = workers.find(w => w.id === wId || w._id === wId);
    if (currentW) {
      const taskWorkerName = task.worker?.name || task.assignedWorkerId?.name || (typeof task.assignedWorkerId === 'string' ? task.assignedWorkerId : '');
      if (taskWorkerName && taskWorkerName.toLowerCase().includes(currentW.name.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  // Filtered tasks for active selected worker
  const displayedTasks = tasks.filter(t => isTaskForWorker(t, selectedWorkerId));

  // Count metrics for active worker
  const pendingCount = displayedTasks.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
  const verificationCount = displayedTasks.filter(t => t.status === 'VERIFICATION').length;
  const resolvedCount = displayedTasks.filter(t => t.status === 'RESOLVED' || t.status === 'COMPLETED').length;

  // Client-side image compression to speed up upload from 10s to <100ms
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

  // Save Before-Work arrival photo only (Marks task IN_PROGRESS)
  const handleSaveBeforePhotoOnly = async () => {
    if (!beforeFile) {
      setErrorMsg("Please capture or select an arrival/before photo first.");
      return;
    }
    setUploading(true);
    setErrorMsg('');
    try {
      const targetId = activeTask._id || activeTask.id || activeTask.taskId;
      const formData = new FormData();
      formData.append('beforeImage', beforeFile);
      if (workerGps.lat && workerGps.lng) {
        formData.append('latitude', workerGps.lat);
        formData.append('longitude', workerGps.lng);
        formData.append('workerAddress', workerGps.address || '');
      }

      const res = await axios.post(`/api/tasks/${targetId}/before-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const photoPath = res.data?.photoPath || res.data?.task?.beforeImage;

      setUploading(false);
      setTasks(prev => prev.map(t => (t._id === targetId || t.id === targetId || t.taskId === targetId)
        ? { ...t, status: 'IN_PROGRESS', beforeImage: photoPath }
        : t
      ));
      setCameraMode(null);
      setBeforeFile(null);
      setBeforePreview(null);
      setSuccessToast(`Before-work arrival photo saved! Task is now In-Progress.`);
      setTimeout(() => setSuccessToast(''), 6000);
      fetchTasks();
    } catch (err) {
      setUploading(false);
      setErrorMsg(err.response?.data?.message || 'Error saving before photo.');
    }
  };

  // Submit Work Photo (Worker captures after photo proof and submits both Before & After to Admin)
  const handleSubmitWorkPhoto = async () => {
    if (!capturedImage) {
      setErrorMsg("Please capture or select the completed work (after) photo first.");
      return;
    }
    setUploading(true);
    setErrorMsg('');
    try {
      const targetId = activeTask._id || activeTask.id || activeTask.taskId;
      
      // Determine worker GPS and physical address
      let lat = workerGps.lat;
      let lng = workerGps.lng;
      let address = workerGps.address;

      if (!lat || !lng) {
        try {
          const pos = await new Promise((res, rej) => {
            if (!navigator.geolocation) return rej(new Error('No geo'));
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 6000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          address = await reverseGeocode(lat, lng);
          setWorkerGps({ lat, lng, address });
        } catch (e) {
          lat = activeTask.location?.latitude || 19.0760;
          lng = activeTask.location?.longitude || 72.8777;
          address = activeTask.location?.address || '';
        }
      }

      const formData = new FormData();
      formData.append('afterImage', capturedImage);

      // Attach before photo file if freshly captured/uploaded, or pass URL string if already present
      if (beforeFile) {
        formData.append('beforeImage', beforeFile);
      } else {
        const existingBefore = beforePreview || activeTask?.beforeImage || activeTask?.complaintId?.photoUrl || activeTask?.complaint?.photoUrl;
        if (existingBefore) {
          formData.append('beforeImage', existingBefore);
        }
      }

      formData.append('workerId', activeWorker.id || activeWorker._id);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('workerAddress', address || '');
      formData.append('timestamp', new Date().toISOString());

      const res = await axios.post(`/api/tasks/${targetId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const savedAfter = res.data?.verification?.afterImage || '/uploads/after-captured.jpg';
      const savedBefore = res.data?.verification?.beforeImage || beforePreview;

      setUploading(false);
      setTasks(prev => prev.map(t => (t._id === targetId || t.id === targetId || t.taskId === targetId) 
        ? { ...t, status: 'VERIFICATION', afterImage: savedAfter, beforeImage: savedBefore || t.beforeImage } 
        : t
      ));
      setCameraMode(null);
      setCapturedImage(null);
      setImagePreview(null);
      setBeforeFile(null);
      setBeforePreview(null);
      setSuccessToast(`Both Before & After photos successfully submitted to Municipal Admin for verification!`);
      setTimeout(() => setSuccessToast(''), 6000);
      fetchTasks();
    } catch (err) {
      setUploading(false);
      setErrorMsg(err.response?.data?.message || 'Error submitting work evidence.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 md:px-8 max-w-6xl mx-auto space-y-6">
      
      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 text-sm font-semibold"
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

      {/* TOP HEADER */}
      <div className="bg-white p-6 rounded-card border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-brand-text tracking-tight">
                Field Operations Console
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                Multi-Worker Dispatch & Verification System • Municipal Field Task Portal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS Tracking Active</span>
          </div>
          <button 
            onClick={fetchTasks} 
            title="Refresh Tasks"
            className="p-2.5 bg-brand-bg border border-brand-border rounded-xl hover:bg-gray-100 text-brand-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WORKER CLASSIFIER & SELECTOR TABS */}
      <div className="bg-white p-5 rounded-card border border-brand-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Worker Classification & Dispatch Switcher
            </span>
            <h2 className="text-base font-extrabold text-brand-text mt-0.5">
              Select Active Field Worker
            </h2>
          </div>
          <p className="text-xs text-brand-muted">
            Click a worker below to view the work orders assigned specifically to them
          </p>
        </div>

        {/* Worker Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {workers.map((w) => {
            const isSelected = selectedWorkerId === w.id || selectedWorkerId === w._id;
            const count = tasks.filter(t => isTaskForWorker(t, w.id || w._id)).length;
            const inProgCount = tasks.filter(t => isTaskForWorker(t, w.id || w._id) && (t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS')).length;

            return (
              <button
                key={w.id || w._id}
                onClick={() => handleSelectWorker(w.id || w._id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all relative cursor-pointer ${
                  isSelected
                    ? 'border-brand-blue bg-blue-50/40 shadow-sm ring-2 ring-brand-blue/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                {/* Active Indicator Badge */}
                {isSelected && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-brand-blue text-white text-[10px] font-extrabold rounded-full flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow-xs ${
                    w.id === 'WRK-201' ? 'bg-emerald-600' : w.id === 'WRK-202' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {w.avatar || w.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-brand-text flex items-center gap-1.5">
                      {w.name}
                      <span className="text-[11px] font-mono text-gray-400 font-normal">({w.id})</span>
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" /> {w.phone}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Assigned Tasks:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-bold text-[11px]">
                      {count} Total
                    </span>
                    {inProgCount > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                        {inProgCount} To Do
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* All Workers Master View Tab */}
        <div className="pt-1 flex items-center justify-between text-xs">
          <button
            onClick={() => handleSelectWorker('ALL')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              selectedWorkerId === 'ALL'
                ? 'bg-brand-text text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> View All Field Workers (Citywide Master Feed)
          </button>

          <span className="text-brand-muted text-[11px] hidden sm:inline">
            💡 Admin assigns tasks to workers in the Admin Portal Complaints tab
          </span>
        </div>
      </div>

      {/* ACTIVE WORKER IDENTITY BANNER */}
      {selectedWorkerId !== 'ALL' && (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-card shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner">
                {activeWorker.avatar || activeWorker.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ON DUTY • ACTIVE
                  </span>
                  <span className="font-mono text-xs text-white/60">ID: {activeWorker.id}</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">{activeWorker.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-1">
                  <span className="font-mono text-emerald-300 font-semibold">Operator ID: {activeWorker.id}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-white/70">
                    <Phone className="w-3 h-3 text-white/50" /> {activeWorker.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
              <div className="px-3 py-1">
                <span className="text-2xl font-black text-white">{pendingCount}</span>
                <p className="text-[10px] font-semibold text-white/70 uppercase">To Do</p>
              </div>
              <div className="px-3 py-1 border-x border-white/10">
                <span className="text-2xl font-black text-purple-300">{verificationCount}</span>
                <p className="text-[10px] font-semibold text-white/70 uppercase">Verifying</p>
              </div>
              <div className="px-3 py-1">
                <span className="text-2xl font-black text-emerald-400">{resolvedCount}</span>
                <p className="text-[10px] font-semibold text-white/70 uppercase">Solved</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASK LIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-brand-text">
              {selectedWorkerId === 'ALL' ? 'All Municipal Work Orders' : `Assigned Tasks for ${activeWorker.name}`}
            </h3>
            <p className="text-xs text-brand-muted">
              {displayedTasks.length} task{displayedTasks.length === 1 ? '' : 's'} assigned • Upload completion photo proof for Municipal Admin approval
            </p>
          </div>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : displayedTasks.length === 0 ? (
          <div className="bg-white rounded-card border border-brand-border p-10 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-base text-brand-text">
                No tasks assigned to {selectedWorkerId === 'ALL' ? 'field operators' : activeWorker.name} yet
              </h4>
              <p className="text-xs text-brand-muted">
                To dispatch work to {selectedWorkerId === 'ALL' ? 'workers' : activeWorker.name}, go to the <strong>Admin Portal &gt; Complaints Register</strong>, click <strong>"Assign Worker"</strong>, and choose <strong>{activeWorker.name}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {displayedTasks.map((t, idx) => {
              const isVerification = t.status === 'VERIFICATION';
              const isResolved = t.status === 'RESOLVED' || t.status === 'COMPLETED';
              const latDisplay = t.location?.latitude || 19.0760;
              const lngDisplay = t.location?.longitude || 72.8777;
              const citizenPhoto = t.complaintId?.photoUrl || t.complaint?.photoUrl;
              const workerAssigned = t.worker || workers.find(w => w.id === t.workerId || w._id === t.workerId) || activeWorker;

              return (
                <div 
                  key={t._id || t.id || t.taskId || idx} 
                  className="bg-white rounded-card border border-brand-border p-6 shadow-xs space-y-5 hover:border-gray-300 transition-all"
                >
                  {/* Task Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {t.taskId}
                      </span>
                      {t.priority && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          t.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          t.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {t.priority} Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        isResolved ? 'bg-emerald-100 text-emerald-800' :
                        isVerification ? 'bg-purple-100 text-purple-800 animate-pulse' :
                        t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isResolved ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED & RESOLVED</>
                        ) : isVerification ? (
                          <><Clock className="w-3.5 h-3.5" /> PENDING ADMIN VERIFICATION</>
                        ) : (
                          <><Wrench className="w-3.5 h-3.5" /> {t.status}</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Worker Assigned Indicator Tag */}
                  <div className="flex items-center gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <UserCheck className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="text-gray-600">
                      Assigned Field Worker: <strong className="text-brand-text">{workerAssigned?.name || 'Worker'}</strong> ({workerAssigned?.id || workerAssigned?._id || 'WRK'})
                    </span>
                  </div>

                  {/* Complaint Details */}
                  <div>
                    <h4 className="font-extrabold text-lg text-brand-text">
                      {t.complaintId?.category || 'Civic Infrastructure Repair'}
                    </h4>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      {t.complaintId?.description || 'Civic maintenance issue requiring field inspection, cleanup, and completion proof.'}
                    </p>
                  </div>

                  {/* DUAL PHOTO PROGRESS & EVIDENCE SECTION */}
                  {(() => {
                    const beforePhoto = t.beforeImage || t.complaintId?.photoUrl || t.complaint?.photoUrl;
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. BEFORE PHOTO CARD (Initial Condition / Site Arrival) */}
                        <div className={`p-4 rounded-2xl border space-y-3 ${
                          beforePhoto ? 'bg-blue-50/40 border-blue-200' : 'bg-amber-50/50 border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-brand-text flex items-center gap-1.5">
                              <Camera className="w-4 h-4 text-brand-blue" />
                              1. Before-Work Photo
                            </span>
                            {beforePhoto ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {t.beforeImage ? 'Worker Site Arrival' : 'Citizen Reference'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                                ⚠️ No Before Photo
                              </span>
                            )}
                          </div>

                          {beforePhoto ? (
                            <div className="space-y-2">
                              <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
                                <img 
                                  src={beforePhoto} 
                                  alt="Before Condition" 
                                  className="w-full h-36 object-cover group-hover:scale-105 transition-all duration-300"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <a 
                                  href={beforePhoto} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                                  title="Expand Full Photo"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 truncate">
                                  {t.beforeImage ? 'Recorded on site by field worker' : 'Citizen reported initial defect'}
                                </span>
                                {!isVerification && !isResolved && (
                                  <button
                                    onClick={() => {
                                      setActiveTask(t);
                                      setCameraMode('BEFORE');
                                      setBeforeFile(null);
                                      setBeforePreview(beforePhoto);
                                      setErrorMsg('');
                                    }}
                                    className="text-brand-blue font-bold hover:underline shrink-0 ml-2"
                                  >
                                    Retake
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-white/80 rounded-xl border border-dashed border-amber-300 text-center space-y-2">
                              <p className="text-xs text-amber-900 font-semibold">
                                No citizen photo attached for this complaint.
                              </p>
                              <p className="text-[11px] text-amber-700">
                                Worker should capture the initial defect photo upon arriving on site before cleaning or repairing.
                              </p>
                              {!isVerification && !isResolved && (
                                <button
                                  onClick={() => {
                                    setActiveTask(t);
                                    setCameraMode('BEFORE');
                                    setBeforeFile(null);
                                    setBeforePreview(null);
                                    setErrorMsg('');
                                  }}
                                  className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Capture Before Photo Now
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 2. AFTER PHOTO CARD (Work Resolution / Completion Proof) */}
                        <div className={`p-4 rounded-2xl border space-y-3 ${
                          t.afterImage ? 'bg-purple-50/50 border-purple-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-brand-text flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                              2. After-Work Photo
                            </span>
                            {t.afterImage ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                {isResolved ? 'Verified & Solved' : 'In Verification'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                Awaiting Completion
                              </span>
                            )}
                          </div>

                          {t.afterImage ? (
                            <div className="space-y-2">
                              <div className="relative group rounded-xl overflow-hidden border border-purple-200 bg-white">
                                <img 
                                  src={t.afterImage} 
                                  alt="Work Resolution" 
                                  className="w-full h-36 object-cover group-hover:scale-105 transition-all duration-300"
                                />
                                <a 
                                  href={t.afterImage} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                                  title="Expand Full Photo"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <p className="text-[11px] text-purple-800">
                                {isResolved ? 'Approved and resolved by Municipal Admin.' : 'Submitted for Admin AI Vision Verification.'}
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-white/80 rounded-xl border border-dashed border-gray-300 text-center space-y-2">
                              <p className="text-xs text-gray-700 font-semibold">
                                Completion proof not yet uploaded.
                              </p>
                              <p className="text-[11px] text-gray-500">
                                After completing cleanup or repair, capture the clean site photo to submit to Municipal Admin.
                              </p>
                              {!isVerification && !isResolved && (
                                <button
                                  onClick={() => {
                                    setActiveTask(t);
                                    setCameraMode('COMPLETE');
                                    setCapturedImage(null);
                                    setImagePreview(null);
                                    setBeforeFile(null);
                                    setBeforePreview(beforePhoto);
                                    setErrorMsg('');
                                  }}
                                  className="mt-1 px-3 py-1.5 bg-brand-emerald hover:bg-[#066749] text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Upload Work Photo
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Location Bar */}
                  <div className="flex items-center gap-2 text-xs text-brand-muted bg-brand-bg p-3 rounded-xl border border-brand-border">
                    <MapPin className="w-4 h-4 text-brand-emerald shrink-0" />
                    <span className="truncate">Incident Location: <strong>{t.location?.address || t.complaintId?.location?.address || `Coordinates: ${latDisplay.toFixed(5)}, ${lngDisplay.toFixed(5)}`}</strong></span>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {(() => {
                      const beforePhoto = t.beforeImage || t.complaintId?.photoUrl || t.complaint?.photoUrl;
                      if (!isVerification && !isResolved) {
                        return (
                          <>
                            {!beforePhoto && (
                              <button 
                                onClick={() => { 
                                  setActiveTask(t); 
                                  setCameraMode('BEFORE'); 
                                  setBeforeFile(null); 
                                  setBeforePreview(null);
                                  setErrorMsg(''); 
                                }}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                              >
                                <Camera className="w-4 h-4" /> 1. Capture Before Photo (Arrival)
                              </button>
                            )}

                            <button 
                              onClick={() => { 
                                setActiveTask(t); 
                                setCameraMode('COMPLETE'); 
                                setCapturedImage(null); 
                                setImagePreview(null);
                                setBeforeFile(null);
                                setBeforePreview(beforePhoto);
                                setErrorMsg(''); 
                              }}
                              className="px-6 py-2.5 bg-brand-emerald text-white rounded-xl text-xs font-extrabold hover:bg-[#066749] flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" /> 
                              {beforePhoto ? 'Upload Work Photo & Complete' : '2. Upload After Photo & Complete'}
                            </button>
                          </>
                        );
                      } else if (isVerification) {
                        return (
                          <div className="p-3.5 bg-purple-50 text-purple-800 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-2.5 w-full">
                            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                            <div>
                              <span>Both Before &amp; After photos submitted! Municipal Admin is verifying this task in Admin Panel &gt; Verification Center.</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2.5 w-full">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Task verified and marked Solved by Admin!</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WORKER PHOTO CAPTURE & SUBMISSION MODAL */}
      <AnimatePresence>
        {cameraMode && activeTask && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-card p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-brand-text">
                    {cameraMode === 'BEFORE' 
                      ? 'Capture Before-Work Photo (Site Arrival Proof)' 
                      : 'Upload Work Resolution Evidence (Before & After Proof)'}
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Task <strong className="text-brand-blue">{activeTask.taskId}</strong> • Operator: <strong className="text-brand-text">{activeWorker.name}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => { 
                    setCameraMode(null); 
                    setImagePreview(null); 
                    setCapturedImage(null); 
                    setBeforeFile(null);
                    setBeforePreview(null);
                  }} 
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* MODE 1: BEFORE PHOTO ARRIVAL CAPTURE ONLY */}
              {cameraMode === 'BEFORE' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    📷 <strong>Site Arrival Requirement:</strong> Capture the initial defective site condition before starting any cleanup or repair work. This photo serves as the official <strong>Before Photo</strong> for municipal AI verification.
                  </div>

                  {/* Before Photo Upload Box */}
                  <div className="border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center space-y-3 bg-amber-50/30">
                    {beforePreview ? (
                      <div className="space-y-3">
                        <img 
                          src={beforePreview} 
                          alt="Before Preview" 
                          className="w-full max-h-64 object-cover rounded-xl border border-amber-200 shadow-xs mx-auto" 
                        />
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Arrival photo ready: {beforeFile?.name || 'Initial defect image'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-amber-600 mx-auto" />
                        <p className="text-xs text-gray-600 max-w-sm mx-auto">
                          Take a photo of the defect or site condition when arriving on-site.
                        </p>
                      </>
                    )}

                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleBeforeFileSelected} 
                      className="hidden" 
                      ref={beforeInputRef} 
                    />
                    
                    <button 
                      type="button"
                      onClick={() => beforeInputRef.current?.click()} 
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      {beforePreview ? '📸 Change / Retake Arrival Photo' : '📸 Open Camera / Choose Photo'}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button 
                      onClick={() => { setCameraMode(null); setBeforeFile(null); setBeforePreview(null); }} 
                      className="px-4 py-2 text-xs text-brand-muted hover:text-brand-text font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveBeforePhotoOnly} 
                      disabled={uploading || !beforeFile}
                      className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                        !beforeFile || uploading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-amber-600 hover:bg-amber-700 active:scale-95 cursor-pointer'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      {uploading ? 'Saving Arrival Photo...' : 'Save Before Photo & Start Work'}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: COMPLETE WORK (DUAL BEFORE + AFTER EVIDENCE) */}
              {cameraMode === 'COMPLETE' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-brand-blue leading-relaxed">
                    ℹ️ Municipal verification requires <strong>both Before and After photos</strong>. The Admin and AI Vision Model compare both photos to confirm the issue has been completely fixed.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SLOT 1: BEFORE PHOTO */}
                    <div className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-gray-50/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-brand-text flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-brand-blue" />
                          1. Before Photo (Initial Defect)
                        </span>
                        {beforePreview ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Attached
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Optional / Missing
                          </span>
                        )}
                      </div>

                      {beforePreview ? (
                        <div className="space-y-2">
                          <img 
                            src={beforePreview} 
                            alt="Before condition" 
                            className="w-full h-36 object-cover rounded-xl border border-gray-300 shadow-xs" 
                          />
                          <button
                            type="button"
                            onClick={() => beforeInputRef.current?.click()}
                            className="w-full py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                          >
                            Change Before Photo
                          </button>
                        </div>
                      ) : (
                        <div className="py-8 text-center space-y-2 border-2 border-dashed border-gray-300 rounded-xl">
                          <p className="text-xs text-gray-500">No before photo attached yet</p>
                          <button
                            type="button"
                            onClick={() => beforeInputRef.current?.click()}
                            className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                          >
                            📸 Upload Before Photo
                          </button>
                        </div>
                      )}

                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleBeforeFileSelected} 
                        className="hidden" 
                        ref={beforeInputRef} 
                      />
                    </div>

                    {/* SLOT 2: AFTER PHOTO */}
                    <div className="border border-emerald-200 rounded-2xl p-4 space-y-3 bg-emerald-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          2. After Photo (Resolution Proof) *
                        </span>
                        {imagePreview ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 animate-pulse">
                            Required
                          </span>
                        )}
                      </div>

                      {imagePreview ? (
                        <div className="space-y-2">
                          <img 
                            src={imagePreview} 
                            alt="After Resolution" 
                            className="w-full h-36 object-cover rounded-xl border border-emerald-300 shadow-xs" 
                          />
                          <button
                            type="button"
                            onClick={() => afterInputRef.current?.click()}
                            className="w-full py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all"
                          >
                            Change After Photo
                          </button>
                        </div>
                      ) : (
                        <div className="py-8 text-center space-y-2 border-2 border-dashed border-emerald-300 rounded-xl">
                          <p className="text-xs text-emerald-900 font-semibold">Capture completed site work</p>
                          <button
                            type="button"
                            onClick={() => afterInputRef.current?.click()}
                            className="px-3 py-1.5 bg-brand-emerald text-white rounded-lg text-xs font-bold hover:bg-[#066749] transition-all"
                          >
                            📸 Open Camera / Choose Photo
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

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button 
                      onClick={() => { 
                        setCameraMode(null); 
                        setImagePreview(null); 
                        setCapturedImage(null); 
                        setBeforeFile(null);
                        setBeforePreview(null);
                      }} 
                      className="px-4 py-2 text-xs text-brand-muted hover:text-brand-text font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmitWorkPhoto} 
                      disabled={uploading || !capturedImage}
                      className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                        !capturedImage || uploading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-brand-emerald hover:bg-[#066749] active:scale-95 cursor-pointer'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {uploading ? 'Submitting to Admin...' : 'Submit Evidence to Admin'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
