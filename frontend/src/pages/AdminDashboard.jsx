import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Map, ShieldCheck, Users, CloudRain, BarChart2, 
  FileText, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, RefreshCw, 
  Download, Search, Filter, PieChart as PieChartIcon, TrendingUp, 
  Building2, Bell, ChevronDown, Check, ArrowRight, Eye, Camera, 
  Wrench, Clock, Activity, Zap, HardHat, Compass, AlertOctagon, CheckSquare,
  Flame, MapPin, Layers, Send, Siren, MoreVertical, Calendar, ChevronLeft,
  ChevronRight, ArrowUpDown, Trash2, Lightbulb, Droplets, Plus, X, User, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, AreaChart, Area, Legend 
} from 'recharts';
import LeafletMap from '../components/LeafletMap';
import VerificationModal from '../components/VerificationModal';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useSocket } from '../context/SocketContext';

// Curated modern color tokens for charts
const CATEGORY_COLORS = [
  '#059669', // Emerald (Sanitation & Garbage)
  '#2563EB', // Blue (Roads & Potholes)
  '#D97706', // Amber (Streetlights & Electrical)
  '#7C3AED', // Violet (Drainage & Flooding)
  '#0891B2', // Cyan (Water Supply & Leakage)
  '#E11D48', // Rose (Illegal Dumping & Hazards)
  '#4F46E5', // Indigo (Public Sanitation)
  '#64748B'  // Slate (Other Civic Issues)
];

const STATUS_COLORS = {
  RESOLVED: '#059669',
  COMPLETED: '#059669',
  IN_PROGRESS: '#D97706',
  ASSIGNED: '#2563EB',
  VERIFICATION: '#7C3AED',
  PENDING: '#6366F1',
  REJECTED: '#EF4444'
};

export default function AdminDashboard() {
  const { socket } = useSocket();

  // Active navigation tab (Defaulting to 'analytics' as seen in the user's screenshot)
  const [activeTab, setActiveTab] = useState('analytics');

  const [stats, setStats] = useState({
    totalComplaints: 0,
    activeTasks: 0,
    resolvedIssues: 0,
    verificationRate: 0,
    criticalAlerts: 0,
    cleanlinessScore: 100
  });
  const [complaints, setComplaints] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [weatherRisk, setWeatherRisk] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchToast, setDispatchToast] = useState(null);

  // Inspector & Assignment Modals State
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [verifSubTab, setVerifSubTab] = useState('PENDING'); // 'PENDING' | 'SOLVED' | 'REJECTED'
  const [verifyingModelId, setVerifyingModelId] = useState(null);

  // Complaints Register State & Filters
  const [complaintSearch, setComplaintSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedComplaintIds, setSelectedComplaintIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedComplaintView, setSelectedComplaintView] = useState(null);
  const [recalculatingPriorities, setRecalculatingPriorities] = useState(false);

  const handleRecalculateAiPriorities = async () => {
    setRecalculatingPriorities(true);
    try {
      const res = await axios.post('/api/complaints/recalculate-priorities');
      setDispatchToast({
        title: '✨ AI Priority Evaluation Complete',
        message: res.data?.message || 'All civic complaints successfully re-assessed using AI Priority Engine.'
      });
      await fetchAdminData(true);
    } catch (err) {
      alert('Error evaluating priorities with AI: ' + (err.response?.data?.message || err.message));
    } finally {
      setRecalculatingPriorities(false);
    }
  };

  // Top Bar State
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAdminDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get('/api/admin/statistics'),
        axios.get('/api/complaints?all=true'),
        axios.get('/api/verifications'),
        axios.get('/api/auth/workers'),
        axios.get('/api/weather/flood-risk'),
        axios.get('/api/admin/audit-logs')
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data);
      if (results[1].status === 'fulfilled') setComplaints(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setVerifications(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setWorkers(results[3].value.data || []);
      if (results[4].status === 'fulfilled') setWeatherRisk(results[4].value.data);
      if (results[5].status === 'fulfilled') setAuditLogs(results[5].value.data || []);
    } catch (err) {
      console.warn("Error loading administrative data", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const pollInterval = setInterval(() => {
      axios.get('/api/verifications')
        .then(res => {
          if (res.data && Array.isArray(res.data)) setVerifications(res.data);
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(pollInterval);
  }, []);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;
    const handleSync = () => fetchAdminData(true);
    socket.on('verification:created', handleSync);
    socket.on('verification.approved', handleSync);
    socket.on('verification.rejected', handleSync);
    socket.on('complaint:new', handleSync);
    socket.on('complaint:updated', handleSync);
    socket.on('task:updated', handleSync);

    return () => {
      socket.off('verification:created', handleSync);
      socket.off('verification.approved', handleSync);
      socket.off('verification.rejected', handleSync);
      socket.off('complaint:new', handleSync);
      socket.off('complaint:updated', handleSync);
      socket.off('task:updated', handleSync);
    };
  }, [socket]);

  // Direct approve & reject actions
  const handleDirectApprove = async (verifId) => {
    setVerifications(prev => prev.map(v => 
      (v._id === verifId || v.verificationId === verifId) 
        ? { ...v, status: 'APPROVED', adminDecisionAt: new Date().toISOString() } 
        : v
    ));
    try {
      await axios.patch(`/api/verifications/${verifId}/approve`);
      fetchAdminData(true);
    } catch (err) {
      alert("Failed to approve verification.");
      fetchAdminData(true);
    }
  };

  const handleDirectReject = async (verifId) => {
    const reason = prompt("Enter rejection reason for worker:", "Defect still visible / proof requires revision");
    if (!reason) return;
    setVerifications(prev => prev.map(v => 
      (v._id === verifId || v.verificationId === verifId) 
        ? { ...v, status: 'REJECTED', rejectionReason: reason } 
        : v
    ));
    try {
      await axios.patch(`/api/verifications/${verifId}/reject`, { reason });
      fetchAdminData(true);
    } catch (err) {
      alert("Failed to reject verification.");
      fetchAdminData(true);
    }
  };

  const handleAssignWorker = async () => {
    if (!assignModalComplaint || !selectedWorkerId) return;
    try {
      await axios.patch(`/api/complaints/${assignModalComplaint._id}/assign`, { workerId: selectedWorkerId });
      setAssignModalComplaint(null);
      fetchAdminData(true);
    } catch (err) {
      alert("Failed to assign worker.");
    }
  };

  const handleVerifyViaModel = async (v) => {
    setVerifyingModelId(v._id);
    try {
      const res = await axios.post(`/api/verifications/${v._id}/verify-model`);
      const updated = res.data?.verification;
      if (updated) {
        setVerifications(prev => prev.map(item => item._id === v._id ? { ...item, ...updated } : item));
        setSelectedVerification(updated);
      } else {
        setSelectedVerification(v);
      }
    } catch (err) {
      setSelectedVerification(v);
    } finally {
      setVerifyingModelId(null);
    }
  };

  // Export CSV Report
  const exportCSV = () => {
    const headers = "Complaint ID,Category,Priority,Status,Address,Created At\n";
    const rows = complaints.map(c => 
      `"${c.complaintId || c.id}","${c.category || ''}","${c.priority || ''}","${c.status || ''}","${(c.location?.address || '').replace(/"/g, '""')}","${c.createdAt || ''}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CleanCity_Municipal_Report_${Date.now()}.csv`;
    a.click();
  };

  // Real-time Aggregated Chart Data
  const totalComplaintsCount = complaints.length;

  const categoryAggregated = complaints.reduce((acc, c) => {
    const cat = c.category || 'Civic Work';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryAggregated)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalComplaintsCount > 0 ? Math.round((value / totalComplaintsCount) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value);

  const statusAggregated = complaints.reduce((acc, c) => {
    let s = c.status || 'PENDING';
    if (s === 'COMPLETED') s = 'RESOLVED';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusOrder = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'VERIFICATION', 'RESOLVED', 'REJECTED'];
  const statusChartData = statusOrder.map(statusKey => ({
    name: statusKey.replace('_', ' '),
    rawStatus: statusKey,
    count: statusAggregated[statusKey] || 0,
    color: STATUS_COLORS[statusKey] || '#64748B'
  })).filter(item => item.count > 0 || ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(item.rawStatus));

  // 7-Day Resolution & Inbound Timeline Simulation
  const trendChartData = [
    { day: 'Mon', inbound: 4, resolved: 3 },
    { day: 'Tue', inbound: 7, resolved: 5 },
    { day: 'Wed', inbound: 5, resolved: 6 },
    { day: 'Thu', inbound: 9, resolved: 8 },
    { day: 'Fri', inbound: 8, resolved: 9 },
    { day: 'Sat', inbound: 6, resolved: 7 },
    { day: 'Sun', inbound: 3, resolved: 5 }
  ];

  // Custom Chart Tooltips
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: data.payload.fill || data.color }} />
            <span className="font-bold">{data.name}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Issues:</span>
            <span className="font-mono font-bold text-white">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Share:</span>
            <span className="font-mono font-bold text-emerald-400">{data.payload.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: data.payload.color }} />
            <span>{data.payload.name}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Complaints:</span>
            <span className="font-mono font-bold text-white text-sm">{data.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const pendingVerifCount = verifications.filter(v => (v.status || 'PENDING') === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
              CityConnectAI
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">
              Smart Civic Operations Platform • Municipal Command Center
            </div>
          </div>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center gap-3">
          
          <button 
            onClick={() => fetchAdminData()} 
            title="Refresh Operations Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button 
            onClick={exportCSV} 
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {pendingVerifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {pendingVerifCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Command Center Alerts</h4>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {pendingVerifCount} Pending
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {verifications.filter(v => (v.status || 'PENDING') === 'PENDING').slice(0, 3).map((v, idx) => (
                    <div key={idx} className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/60">
                      <p className="font-semibold text-slate-800">Verification Awaiting Decision</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {v.verificationId} • Worker: {v.workerId?.name || 'Assigned Operator'}
                      </p>
                    </div>
                  ))}
                  {pendingVerifCount === 0 && (
                    <p className="text-xs text-slate-400 py-2 text-center">All worker submissions verified</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Chip with Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                AD
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Municipal Admin
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  Operations Command HQ
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Portal Switcher Dropdown */}
            {adminDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Portals</p>
                </div>
                <Link to="/citizen" className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-700 transition-colors">
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Citizen Portal
                </Link>
                <Link to="/worker" className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50/70 hover:text-blue-700 transition-colors">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" /> Field Worker Console
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-x-hidden w-full">
        
        {/* LEFT SIDEBAR (Matching CityConnectAI Design Language) */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0">
          
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4 shrink-0" />
                <span>Analytics &amp; Charts</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Complaints Register</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'complaints' ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {complaints.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'verifications'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verification Center</span>
              </div>
              {pendingVerifCount > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'verifications' ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {pendingVerifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('gis')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'gis'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Map className="w-4 h-4 shrink-0" />
                <span>Live City Map</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('hotspots')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'hotspots' || activeTab === 'flood'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 shrink-0 text-amber-300" />
                <span>Hotspot Intelligence</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {(weatherRisk?.criticalHotspotsCount || 0) > 0 ? weatherRisk.criticalHotspotsCount : 3}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Audit Trail Logs</span>
              </div>
            </button>
          </div>

          {/* Bottom Admin Status Card */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
                <HardHat className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-bold text-xs text-slate-900 truncate">
                  Command HQ
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  Dual AI &amp; GPS Active
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#059669] mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                  <span>System Online</span>
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
          
          {/* TAB: ANALYTICS & CHARTS (Properly Redesigned) */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Header Title & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Civic Maintenance Analytics
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time domain distribution, workflow status breakdown, and municipal operational metrics
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={exportCSV}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" /> Export Dataset
                  </button>
                  <button 
                    onClick={() => fetchAdminData()}
                    className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
                  </button>
                </div>
              </div>

              {/* 4 Summary Analytics Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#e0f2fe]/60 border border-[#bae6fd] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#bae6fd]/70 text-sky-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {totalComplaintsCount}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Total Reported
                    </div>
                  </div>
                </div>

                <div className="bg-[#fef3c7]/60 border border-[#fde68a] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#fde68a]/70 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {stats.activeTasks || statusAggregated['IN_PROGRESS'] || 0}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Active In-Field
                    </div>
                  </div>
                </div>

                <div className="bg-[#dcfce7]/60 border border-[#bbf7d0] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#bbf7d0]/70 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {stats.resolvedIssues || statusAggregated['RESOLVED'] || 0}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Verified &amp; Solved
                    </div>
                  </div>
                </div>

                <div className="bg-[#f3e8ff]/60 border border-[#e9d5ff] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-[#e9d5ff]/70 text-purple-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 leading-tight">
                      {stats.verificationRate || 95}%
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      AI Vision Accuracy
                    </div>
                  </div>
                </div>
              </div>

              {/* THE TWO MAIN HERO CHARTS: CATEGORY DISTRIBUTION & STATUS BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. CATEGORY DISTRIBUTION CARD (Donut Chart + Rich Legend Table) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-[#059669]" />
                          Category Distribution
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Proportional volume across municipal civic departments
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {categoryChartData.length} Domains
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Donut Chart with Center Metric */}
                      <div className="md:col-span-6 relative h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={categoryChartData} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={62} 
                              outerRadius={88}
                              paddingAngle={3}
                            >
                              {categoryChartData.map((_, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Center Metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-2xl font-black text-slate-900 leading-none">
                            {totalComplaintsCount}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                            Total Issues
                          </span>
                        </div>
                      </div>

                      {/* Rich Legend & Percentage Breakdown */}
                      <div className="md:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {categoryChartData.map((cat, idx) => {
                          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                          return (
                            <div key={cat.name} className="p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-slate-800 flex items-center gap-2 truncate max-w-[65%]">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                  <span className="truncate">{cat.name}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{cat.value}</span>
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {cat.percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${cat.percentage}%`, backgroundColor: color }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Highest Category: <strong>{categoryChartData[0]?.name || 'Sanitation'}</strong> ({categoryChartData[0]?.percentage || 0}%)</span>
                    <span className="text-emerald-700 font-semibold">Live System Metric</span>
                  </div>
                </div>

                {/* 2. STATUS BREAKDOWN CARD (Vibrant Multi-Colored Bars + Quick Matrix) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-blue-600" />
                          Status Breakdown
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Workflow pipeline resolution stages across municipal workers
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {Math.round((stats.resolvedIssues / (totalComplaintsCount || 1)) * 100)}% Cleared
                      </span>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomBarTooltip />} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {statusChartData.map((entry, index) => (
                              <Cell key={`bar-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Matrix Indicators */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <div className="font-bold text-emerald-900 text-sm">{stats.resolvedIssues || statusAggregated['RESOLVED'] || 0}</div>
                      <div className="text-[10px] font-medium text-emerald-700">Resolved</div>
                    </div>
                    <div className="p-2 bg-amber-50/70 border border-amber-100 rounded-xl">
                      <div className="font-bold text-amber-900 text-sm">{stats.activeTasks || statusAggregated['IN_PROGRESS'] || 0}</div>
                      <div className="text-[10px] font-medium text-amber-700">In Progress</div>
                    </div>
                    <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <div className="font-bold text-blue-900 text-sm">{statusAggregated['PENDING'] || 0}</div>
                      <div className="text-[10px] font-medium text-blue-700">Pending Queue</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. TIME-SERIES RESOLUTION TREND (New Executive Area Chart) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Weekly Civic Operations Velocity &amp; Inbound Trends
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Comparative daily volume of new complaints vs completed worker resolutions
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <span className="w-3 h-3 rounded-full bg-blue-500" /> Inbound Issues
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" /> Resolved On-Site
                    </span>
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="inbound" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInbound)" />
                      <Area type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Verification Callout Alert */}
              {pendingVerifCount > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-900">
                        {pendingVerifCount} Worker Proof Submission(s) Awaiting Decision
                      </h4>
                      <p className="text-xs text-amber-700">Workers have submitted before & after work evidence requiring admin review and approval.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('verifications')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Review Proofs Now &rarr;
                  </button>
                </div>
              )}

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Complaints</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalComplaints}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tasks</div>
                  <div className="text-3xl font-extrabold text-blue-600 mt-2">{stats.activeTasks}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Issues</div>
                  <div className="text-3xl font-extrabold text-[#059669] mt-2">{stats.resolvedIssues}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Rate</div>
                  <div className="text-3xl font-extrabold text-purple-600 mt-2">{stats.verificationRate}%</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cleanliness Score</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.cleanlinessScore}/100</div>
                </div>
              </div>

              {/* GIS Map + AI Intelligence Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="font-bold text-base text-slate-900 mb-3">Live City Operations Map</h3>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                    <LeafletMap complaints={complaints} workers={workers} height="400px" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 mb-3">AI Intelligence Alerts</h3>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 h-[400px] overflow-y-auto space-y-3">
                    {stats.criticalAlerts > 0 ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-600">
                          <AlertTriangle className="w-4 h-4" /> {stats.criticalAlerts} Critical Issues Pending
                        </div>
                        <p className="text-[11px] text-gray-600">Immediate worker dispatch recommended for open manholes and drainage overflow.</p>
                      </div>
                    ) : (
                      <EmptyState 
                        icon={ShieldCheck} 
                        title="No active AI alerts" 
                        description="Municipal AI monitor reports normal operations across all zones." 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMPLAINTS (Redesigned matching CityConnectAI Mockup) */}
          {activeTab === 'complaints' && (() => {
            // Computed counts
            const compTotal = complaints.length;
            const compPending = complaints.filter(c => c.status === 'PENDING' || c.status === 'SUBMITTED').length;
            const compInProgress = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
            const compResolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'COMPLETED').length;
            const compUnassigned = complaints.filter(c => !c.assignedWorkerId && c.status !== 'RESOLVED' && c.status !== 'COMPLETED').length;

            // Helper to get category metadata
            const getCategoryMeta = (cat) => {
              const c = (cat || '').toLowerCase();
              if (c.includes('road') || c.includes('pothole')) {
                return {
                  label: 'Road / Pothole',
                  bg: 'bg-blue-50 text-blue-600',
                  icon: <Wrench className="w-4 h-4 text-blue-600" />
                };
              }
              if (c.includes('garbage') || c.includes('waste') || c.includes('trash')) {
                return {
                  label: 'Garbage / Waste',
                  bg: 'bg-emerald-50 text-emerald-600',
                  icon: <Trash2 className="w-4 h-4 text-emerald-600" />
                };
              }
              if (c.includes('light') || c.includes('electrical')) {
                return {
                  label: 'Streetlight Broken',
                  bg: 'bg-amber-50 text-amber-600',
                  icon: <Lightbulb className="w-4 h-4 text-amber-600" />
                };
              }
              if (c.includes('drain') || c.includes('flood') || c.includes('overflow')) {
                return {
                  label: 'Drainage / Overflow',
                  bg: 'bg-cyan-50 text-cyan-600',
                  icon: <Droplets className="w-4 h-4 text-cyan-600" />
                };
              }
              if (c.includes('sanitation') || c.includes('toilet') || c.includes('hygiene')) {
                return {
                  label: 'Public Sanitation',
                  bg: 'bg-purple-50 text-purple-600',
                  icon: <Building2 className="w-4 h-4 text-purple-600" />
                };
              }
              if (c.includes('water') || c.includes('pipe') || c.includes('leak')) {
                return {
                  label: 'Water Pipe Leakage',
                  bg: 'bg-blue-50 text-blue-600',
                  icon: <Droplets className="w-4 h-4 text-blue-600" />
                };
              }
              return {
                label: cat || 'Civic Infrastructure',
                bg: 'bg-slate-50 text-slate-600',
                icon: <Activity className="w-4 h-4 text-slate-600" />
              };
            };

            const formatLocation = (c) => {
              const raw = (c.location?.address || c.citizenLocation?.address || '').trim();
              if (!raw) return 'Central Municipal Sector';
              // Remove artificial "Ward" references to display real neighborhood / area names
              const cleaned = raw.replace(/Ward\s*\d+\s*[-–,]*\s*/gi, '').trim();
              if (!cleaned) return raw;
              const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
              return parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
            };

            const formatPriority = (priority, c = {}) => {
              const p = (priority || c.priority || 'Medium').toLowerCase();
              const reason = c.aiPriorityReason || 'Assigned by CityConnectAI Priority Engine';

              if (p === 'high' || p === 'critical') {
                return (
                  <span 
                    title={reason}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 cursor-help"
                  >
                    <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{p === 'critical' ? 'Critical' : 'High'}</span>
                  </span>
                );
              }
              if (p === 'low') {
                return (
                  <span 
                    title={reason}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 cursor-help"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Low</span>
                  </span>
                );
              }
              return (
                <span 
                  title={reason}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 cursor-help"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Medium</span>
                </span>
              );
            };

            const formatStatus = (status) => {
              const s = (status || 'PENDING').toUpperCase();
              if (s === 'RESOLVED' || s === 'COMPLETED') {
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Resolved
                  </span>
                );
              }
              if (s === 'IN_PROGRESS' || s === 'ASSIGNED') {
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    In Progress
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pending
                </span>
              );
            };

            const getWorkerInitials = (name) => {
              if (!name) return 'W';
              const parts = name.trim().split(' ');
              if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
              return name.slice(0, 2).toUpperCase();
            };

            const renderAssignedWorker = (c) => {
              const w = c.assignedWorkerId;
              const isAssigned = !!w && w !== 'Unassigned' && (typeof w === 'object' ? !!w.name : true);
              
              if (isAssigned) {
                const name = typeof w === 'object' ? w.name : (workers.find(wk => (wk.id === w || wk._id === w))?.name || w);
                const code = typeof w === 'object' ? (w.id || w._id || 'WRK-201') : (workers.find(wk => (wk.id === w || wk._id === w))?.id || 'WRK-201');
                const initials = getWorkerInitials(name);
                
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-800 truncate max-w-[120px]">{name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{code}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-xs text-slate-600">Unassigned</div>
                    <div className="text-[10px] text-slate-400">-</div>
                  </div>
                </div>
              );
            };

            const formatReportedDate = (timestamp) => {
              if (!timestamp) return { date: 'Oct 30, 2026', time: '10:25 AM' };
              const d = new Date(timestamp);
              if (isNaN(d.getTime())) return { date: 'Oct 30, 2026', time: '10:25 AM' };
              const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
              return { date, time };
            };

            // Filter complaints
            const filteredComplaints = complaints.filter(c => {
              if (complaintSearch.trim()) {
                const q = complaintSearch.toLowerCase();
                const idMatch = (c.complaintId || c.id || c._id || '').toLowerCase().includes(q);
                const catMatch = (c.category || '').toLowerCase().includes(q);
                const locMatch = (c.location?.address || c.citizenLocation?.address || '').toLowerCase().includes(q);
                const descMatch = (c.description || '').toLowerCase().includes(q);
                if (!idMatch && !catMatch && !locMatch && !descMatch) return false;
              }

              if (statusFilter !== 'ALL') {
                const s = (c.status || '').toUpperCase();
                if (statusFilter === 'PENDING' && s !== 'PENDING' && s !== 'SUBMITTED') return false;
                if (statusFilter === 'IN_PROGRESS' && s !== 'IN_PROGRESS' && s !== 'ASSIGNED') return false;
                if (statusFilter === 'RESOLVED' && s !== 'RESOLVED' && s !== 'COMPLETED') return false;
              }

              if (categoryFilter !== 'ALL') {
                const cat = (c.category || '').toLowerCase();
                const targetCat = categoryFilter.toLowerCase();
                if (!cat.includes(targetCat) && !targetCat.includes(cat)) return false;
              }

              if (priorityFilter !== 'ALL') {
                const p = (c.priority || 'Medium').toLowerCase();
                if (p !== priorityFilter.toLowerCase()) return false;
              }

              return true;
            });

            const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / rowsPerPage));
            const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

            const handleSelectAll = (e) => {
              if (e.target.checked) {
                setSelectedComplaintIds(paginatedComplaints.map(c => c._id || c.id || c.complaintId));
              } else {
                setSelectedComplaintIds([]);
              }
            };

            const handleToggleSelect = (id) => {
              setSelectedComplaintIds(prev => 
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              );
            };

            const handleResetFilters = () => {
              setComplaintSearch('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
              setPriorityFilter('ALL');
              setCurrentPage(1);
            };

            return (
              <div className="space-y-6">
                
                {/* 1. Header Title & Subtitle */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaints Register</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Review, assign and track civic complaints</p>
                  </div>
                </div>

                {/* 2. Five Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full min-w-0">
                  
                  {/* Card 1: Total Complaints */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-slate-900 leading-none">{compTotal}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">Total Complaints</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0" title="vs last week">
                      ↑ 12%<span className="hidden 2xl:inline font-normal text-[9px] text-slate-400"> vs last wk</span>
                    </span>
                  </div>

                  {/* Card 2: Pending */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-slate-900 leading-none">{compPending}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">Pending</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shrink-0" title="vs last week">
                      ↑ 14%<span className="hidden 2xl:inline font-normal text-[9px] text-slate-400"> vs last wk</span>
                    </span>
                  </div>

                  {/* Card 3: In Progress */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-slate-900 leading-none">{compInProgress}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">In Progress</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0" title="vs last week">
                      ↓ 22%<span className="hidden 2xl:inline font-normal text-[9px] text-slate-400"> vs last wk</span>
                    </span>
                  </div>

                  {/* Card 4: Resolved */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-slate-900 leading-none">{compResolved}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">Resolved</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0" title="vs last week">
                      ↑ 36%<span className="hidden 2xl:inline font-normal text-[9px] text-slate-400"> vs last wk</span>
                    </span>
                  </div>

                  {/* Card 5: Unassigned */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-slate-900 leading-none">{compUnassigned}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">Unassigned</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shrink-0" title="vs last week">
                      ↑ 0%<span className="hidden 2xl:inline font-normal text-[9px] text-slate-400"> vs last wk</span>
                    </span>
                  </div>

                </div>

                {/* 3. Comprehensive Filter Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={complaintSearch}
                        onChange={(e) => { setComplaintSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search complaint ID, category or location..."
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#059669] focus:bg-white transition-all font-medium"
                      />
                    </div>

                    {/* Status Select */}
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#059669] font-medium cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>

                    {/* Category Select */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#059669] font-medium cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Road">Road / Pothole</option>
                      <option value="Garbage">Garbage / Waste</option>
                      <option value="Streetlight">Streetlight Broken</option>
                      <option value="Drainage">Drainage / Overflow</option>
                      <option value="Sanitation">Public Sanitation</option>
                      <option value="Water">Water Pipe Leakage</option>
                    </select>

                    {/* Priority Select */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#059669] font-medium cursor-pointer"
                    >
                      <option value="ALL">All Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    {/* Date Range Display */}
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Oct 1, 2026 – Oct 30, 2026</span>
                    </div>

                  </div>

                  {/* Actions Right: AI Priority Button & Reset */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRecalculateAiPriorities}
                      disabled={recalculatingPriorities}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                      title="Run AI Priority Engine to analyze civic risk and assign optimal priority"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${recalculatingPriorities ? 'animate-spin' : 'text-amber-200'}`} />
                      <span>{recalculatingPriorities ? 'Evaluating with AI...' : 'Assign Priority with AI'}</span>
                    </button>

                    <button
                      onClick={handleResetFilters}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* 4. Main Complaints Table */}
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs w-full min-w-0">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs min-w-[760px]">
                      <thead className="bg-[#f8fafc] text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200/90">
                        <tr>
                          <th className="px-3 py-3.5 w-10">
                            <input 
                              type="checkbox"
                              checked={selectedComplaintIds.length > 0 && selectedComplaintIds.length === paginatedComplaints.length}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-slate-300 text-[#059669] focus:ring-emerald-500 cursor-pointer"
                            />
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Complaint ID</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Issue</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Location</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Priority</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Status</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Assigned Worker</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer select-none">
                            <div className="flex items-center gap-1.5">
                              <span>Reported</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">
                              Loading complaints register...
                            </td>
                          </tr>
                        ) : paginatedComplaints.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">
                              No complaints found matching the current filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedComplaints.map((c) => {
                            const cid = c.complaintId || c.id || c._id;
                            const catMeta = getCategoryMeta(c.category);
                            const reportedDate = formatReportedDate(c.createdAt || c.timestamp);
                            const isAssigned = !!c.assignedWorkerId && c.assignedWorkerId !== 'Unassigned';

                            return (
                              <tr key={cid} className="hover:bg-slate-50/70 transition-colors">
                                {/* Checkbox */}
                                <td className="p-4">
                                  <input 
                                    type="checkbox"
                                    checked={selectedComplaintIds.includes(cid)}
                                    onChange={() => handleToggleSelect(cid)}
                                    className="w-4 h-4 rounded border-slate-300 text-[#059669] focus:ring-emerald-500 cursor-pointer"
                                  />
                                </td>

                                {/* Complaint ID */}
                                <td className="p-4">
                                  <span 
                                    onClick={() => setSelectedComplaintView(c)}
                                    className="font-mono font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                  >
                                    {cid}
                                  </span>
                                </td>

                                {/* Issue */}
                                <td className="p-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${catMeta.bg}`}>
                                      {catMeta.icon}
                                    </div>
                                    <span className="font-semibold text-slate-800">{catMeta.label}</span>
                                  </div>
                                </td>

                                {/* Location */}
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[120px]" title={c.location?.address || c.citizenLocation?.address}>
                                      {formatLocation(c)}
                                    </span>
                                  </div>
                                </td>

                                {/* Priority */}
                                <td className="p-4">
                                  {formatPriority(c.priority, c)}
                                </td>

                                {/* Status */}
                                <td className="p-4">
                                  {formatStatus(c.status)}
                                </td>

                                {/* Assigned Worker */}
                                <td className="p-4">
                                  {renderAssignedWorker(c)}
                                </td>

                                {/* Reported */}
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <div>
                                      <div className="font-medium text-xs text-slate-800">{reportedDate.date}</div>
                                      <div className="text-[10px] text-slate-400">{reportedDate.time}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {!isAssigned ? (
                                      <button
                                        onClick={() => setAssignModalComplaint(c)}
                                        className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Assign
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setSelectedComplaintView(c)}
                                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                        View
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setSelectedComplaintView(c)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 5. Pagination Footer */}
                  <div className="p-4 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-medium">
                      Showing {filteredComplaints.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredComplaints.length)} of {filteredComplaints.length} complaints
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                          const pNum = idx + 1;
                          return (
                            <button
                              key={pNum}
                              onClick={() => setCurrentPage(pNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                                currentPage === pNum
                                  ? 'bg-[#059669] text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {pNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>Rows per page</span>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none font-medium cursor-pointer"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB: VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Verification Center (Proof-of-Work Inspector)</h3>
                  <p className="text-xs text-slate-500">Inspect worker Before vs After photo evidence, verify AI analysis, and make resolution decisions.</p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                  <button
                    onClick={() => setVerifSubTab('PENDING')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      verifSubTab === 'PENDING' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Pending</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-extrabold">
                      {pendingVerifCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setVerifSubTab('SOLVED')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      verifSubTab === 'SOLVED' ? 'bg-white text-green-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Solved</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 text-green-800 font-extrabold">
                      {verifications.filter(v => v.status === 'APPROVED' || v.status === 'RESOLVED').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setVerifSubTab('REJECTED')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      verifSubTab === 'REJECTED' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Rejected</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800 font-extrabold">
                      {verifications.filter(v => v.status === 'REJECTED').length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Verifications Cards Grid */}
              {(() => {
                const filtered = verifications.filter(v => {
                  if (verifSubTab === 'PENDING') return (v.status || 'PENDING') === 'PENDING';
                  if (verifSubTab === 'SOLVED') return v.status === 'APPROVED' || v.status === 'RESOLVED';
                  if (verifSubTab === 'REJECTED') return v.status === 'REJECTED';
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <EmptyState 
                      title={`No ${verifSubTab.toLowerCase()} verification proofs`} 
                      description={
                        verifSubTab === 'PENDING'
                          ? 'All worker completion proofs have been verified and processed.'
                          : verifSubTab === 'SOLVED'
                          ? 'No approved/solved resolutions in this category yet.'
                          : 'No rejected proofs recorded.'
                      } 
                    />
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map(v => (
                      <div key={v._id || v.verificationId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-xs text-blue-600">{v.verificationId}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              Complaint: <strong className="text-slate-800">{v.complaintId?.complaintId || v.complaintId || 'CMP-2026-1001'}</strong>
                            </span>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            v.status === 'APPROVED' ? 'bg-green-100 text-green-800' : v.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {v.status === 'APPROVED' ? 'SOLVED' : v.status || 'PENDING'}
                          </span>
                        </div>

                        {/* Dual Photos */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase block">1. Before Photo</span>
                            <div className="h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                              <img src={v.beforeImage} alt="Before" className="h-full w-full object-cover" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-emerald-600 uppercase block">2. After Photo</span>
                            <div className="h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                              <img src={v.afterImage} alt="After" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        </div>

                        {/* Worker Details */}
                        <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100">
                          <div className="flex justify-between">
                            <span>Field Worker:</span>
                            <strong className="text-slate-900">{v.workerId?.name || 'Suresh Kumar'} ({v.workerId?.id || v.workerId?._id || 'WRK-202'})</strong>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleVerifyViaModel(v)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {verifyingModelId === v._id ? 'Inspecting...' : 'AI Vision Inspection'}
                          </button>

                          {(!v.status || v.status === 'PENDING') && (
                            <>
                              <button
                                onClick={() => handleDirectApprove(v._id || v.verificationId)}
                                className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDirectReject(v._id || v.verificationId)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: GIS MAP */}
          {activeTab === 'gis' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Citywide GIS Operations Map</h3>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <LeafletMap complaints={complaints} workers={workers} height="600px" zoom={13} />
              </div>
            </div>
          )}

          {/* TAB: AI COMPLAINT HOTSPOTS & PRIORITY ATTENTION */}
          {(activeTab === 'hotspots' || activeTab === 'flood') && (
            <div className="space-y-6">
              
              {/* Header Title & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Spatial Density AI Engine
                    </span>
                    {(weatherRisk?.criticalHotspotsCount || 0) > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                        ⚠️ {weatherRisk.criticalHotspotsCount} Zone(s) Over 5-Complaint Limit
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
                    AI Complaint Hotspots &amp; Priority Attention
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Automated spatial clustering of civic complaints. Flags high-density zones with &gt; 5 complaints for immediate municipal intervention before public escalation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fetchAdminData(true)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Refresh Intelligence
                  </button>
                </div>
              </div>

              {/* Toast Notification */}
              {dispatchToast && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900">{dispatchToast.title}</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">{dispatchToast.message}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDispatchToast(null)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Primary AI Attention Alert Banner */}
              {(() => {
                const isCritical = (weatherRisk?.criticalHotspotsCount || 0) > 0 || (weatherRisk?.topHotspot?.totalComplaints || 0) >= 5;
                const isElevated = !isCritical && ((weatherRisk?.topHotspot?.totalComplaints || 0) >= 3);
                const topArea = weatherRisk?.topHotspot || { areaName: 'Central Zone', totalComplaints: 0, activeComplaints: 0, dominantCategory: 'Civic Infrastructure' };

                if (isCritical) {
                  return (
                    <div className="bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-3 max-w-3xl">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-rose-600 text-white">
                              CRITICAL HOTSPOT TRIGGERED (&gt; 5 COMPLAINTS)
                            </span>
                            <span className="text-xs font-bold text-rose-800">
                              Zone: {topArea.areaName}
                            </span>
                          </div>
                          
                          <h2 className="text-xl font-bold text-slate-900">
                            High-Density Attention Alert: {topArea.totalComplaints} Clustered Complaints in {topArea.areaName}
                          </h2>

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {weatherRisk?.alertMessage || `Multiple residents in ${topArea.areaName} have reported overlapping civic breakdowns (${topArea.dominantCategory}). Concentration has exceeded the 5-complaint threshold.`}
                          </p>

                          <div className="p-4 bg-white/90 backdrop-blur-xs rounded-xl border border-rose-200 space-y-1.5 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                              <Zap className="w-4 h-4 text-rose-600" />
                              AI Automated Municipal Recommendation:
                            </div>
                            <div className="text-xs text-slate-800 leading-relaxed font-medium">
                              {weatherRisk?.recommendation || `Deploy rapid intervention team to ${topArea.areaName} immediately. Expedite resolution for ${topArea.activeComplaints} pending issues to restore public infrastructure.`}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                          <button
                            onClick={() => {
                              setDispatchToast({
                                title: `Rapid Response Squad Deployed to ${topArea.areaName}`,
                                message: `Ward Supervisor and nearest field teams have been mobilized for immediate inspection.`
                              });
                            }}
                            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Siren className="w-4 h-4" />
                            Dispatch Rapid Response Squad
                          </button>
                          <button
                            onClick={() => setActiveTab('complaints')}
                            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            Review {topArea.totalComplaints} Complaints
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isElevated) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wide">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Elevated Concentration ({topArea.totalComplaints} Complaints)
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {topArea.areaName} approaching the 5-complaint threshold
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl">
                          {weatherRisk?.alertMessage}
                        </p>
                        <div className="text-xs font-semibold text-amber-900 mt-1">
                          Recommendation: {weatherRisk?.recommendation}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDispatchToast({
                            title: `Priority Inspection Scheduled for ${topArea.areaName}`,
                            message: `Preventive squad assigned to inspect cluster before complaints cross threshold.`
                          });
                        }}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                      >
                        Schedule Inspection
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Civic Zone Health: Stable
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        All Neighborhoods Operating Below the 5-Complaint Critical Threshold
                      </h3>
                      <p className="text-xs text-emerald-700">
                        {weatherRisk?.alertMessage || 'No dense clustering detected. Routine operations and standard worker dispatch proceed normally.'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-white text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 shrink-0">
                      Surveillance Active
                    </span>
                  </div>
                );
              })()}

              {/* 4 Metric / KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Critical Hotspots (&gt;5)</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      (weatherRisk?.criticalHotspotsCount || 0) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {weatherRisk?.criticalHotspotsCount || 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Zones</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    {(weatherRisk?.criticalHotspotsCount || 0) > 0 ? (
                      <span className="text-rose-600 font-bold">Needs Immediate Action</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Zero active violations</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Highest Area Density</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {weatherRisk?.topHotspot?.totalComplaints || 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Complaints</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 truncate" title={weatherRisk?.topHotspot?.areaName || 'None'}>
                    In <span className="font-bold text-slate-700">{weatherRisk?.topHotspot?.areaName || 'None'}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Pending in Top Hotspot</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {weatherRisk?.topHotspot?.activeComplaints || 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Active Tickets</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Primary: <span className="font-bold text-amber-700">{weatherRisk?.topHotspot?.dominantCategory || 'Civic'}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Hotspot Trigger Rule</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-purple-700">&gt; 5</span>
                    <span className="text-xs text-slate-500 font-medium">per neighborhood</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Auto-escalates to priority dispatch
                  </div>
                </div>
              </div>

              {/* Spatial Hotspot Map + Dominant Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2 Cols: Hotspots GIS Map */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Map className="w-4 h-4 text-emerald-600" />
                        Live Spatial Hotspots &amp; Complaint Distribution Map
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Interactive GIS mapping of citizen complaints across all municipal sectors
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {complaints.length} Geo-tagged Points
                    </span>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <LeafletMap complaints={complaints} workers={workers} height="380px" zoom={12} />
                  </div>
                </div>

                {/* 1 Col: Top Clustered Areas List */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Priority Attention Zones
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ranked by complaint volume. Areas with &gt; 5 require urgent action.
                    </p>

                    <div className="mt-4 space-y-3">
                      {(weatherRisk?.clusters || []).slice(0, 5).map((cl, idx) => {
                        const isHot = cl.totalComplaints >= 5;
                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl border transition-all ${
                              isHot 
                                ? 'bg-rose-50/70 border-rose-200' 
                                : 'bg-slate-50 border-slate-200/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-xs text-slate-900 truncate max-w-[170px]" title={cl.areaName}>
                                {cl.areaName}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isHot 
                                  ? 'bg-rose-600 text-white animate-pulse' 
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {cl.totalComplaints} Complaints
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                              <span>Primary: <b className="text-slate-700">{cl.dominantCategory}</b></span>
                              <span>Pending: <b className={isHot ? 'text-rose-700' : 'text-slate-700'}>{cl.activeComplaints}</b></span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden flex">
                              <div 
                                className="bg-emerald-500 h-full" 
                                style={{ width: `${cl.totalComplaints > 0 ? (cl.resolvedComplaints / cl.totalComplaints) * 100 : 0}%` }}
                                title={`Resolved: ${cl.resolvedComplaints}`}
                              />
                              <div 
                                className={isHot ? 'bg-rose-500 h-full' : 'bg-amber-500 h-full'}
                                style={{ width: `${cl.totalComplaints > 0 ? (cl.activeComplaints / cl.totalComplaints) * 100 : 0}%` }}
                                title={`Active: ${cl.activeComplaints}`}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {(!weatherRisk?.clusters || weatherRisk?.clusters.length === 0) && (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No complaint clusters detected
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => setActiveTab('complaints')}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Open Full Complaints Register <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comprehensive Hotspots Attention Ranking Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Neighborhood Complaint Clusters &amp; Escalation Status
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitors complaint density across all municipal wards. Automatic alerts trigger when count &gt; 5.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Legend:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Critical (&gt;5)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Elevated (3-4)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Normal (&lt;3)</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Rank / Area</th>
                        <th className="p-4">Total Complaints</th>
                        <th className="p-4">Dominant Category</th>
                        <th className="p-4">Active vs Resolved</th>
                        <th className="p-4">Escalation Status</th>
                        <th className="p-4 text-right">Rapid Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(weatherRisk?.clusters || []).map((cl, idx) => {
                        const isCritical = cl.totalComplaints >= 5;
                        const isElevated = !isCritical && cl.totalComplaints >= 3;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${isCritical ? 'bg-rose-50/30' : ''}`}>
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900">{cl.areaName}</div>
                                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{cl.fullAddress}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">{cl.totalComplaints}</span>
                                {isCritical && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                    &gt; 5 HOTSPOT
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                                {cl.dominantCategory}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="space-y-1 w-32">
                                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                  <span className="text-emerald-700">{cl.resolvedComplaints} solved</span>
                                  <span className="text-rose-700">{cl.activeComplaints} active</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                                  <div 
                                    className="bg-emerald-500 h-full" 
                                    style={{ width: `${cl.totalComplaints > 0 ? (cl.resolvedComplaints / cl.totalComplaints) * 100 : 0}%` }}
                                  />
                                  <div 
                                    className={isCritical ? 'bg-rose-500 h-full' : 'bg-amber-500 h-full'}
                                    style={{ width: `${cl.totalComplaints > 0 ? (cl.activeComplaints / cl.totalComplaints) * 100 : 0}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              {isCritical ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800">
                                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                                  HIGH ATTENTION REQUIRED
                                </span>
                              ) : isElevated ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  ELEVATED ATTENTION
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  STABLE
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  setDispatchToast({
                                    title: `Dispatched Intervention Squad to ${cl.areaName}`,
                                    message: `Squad notified to resolve ${cl.activeComplaints} open complaints immediately.`
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isCritical
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isCritical ? '🚨 Dispatch Squad' : 'Inspect Zone'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {(!weatherRisk?.clusters || weatherRisk?.clusters.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No area clusters found in records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">System Audit Trail Log</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target ID</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{log.user || 'System'}</td>
                        <td className="p-4 font-semibold text-emerald-700">{log.action}</td>
                        <td className="p-4 font-mono text-slate-600">{log.targetId}</td>
                        <td className="p-4 text-slate-600">{log.details}</td>
                        <td className="p-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">No audit logs recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ASSIGN WORKER MODAL */}
      <AnimatePresence>
        {assignModalComplaint && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-slate-900">Dispatch Field Worker</h3>
                <button onClick={() => setAssignModalComplaint(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-600">
                Assigning complaint <strong className="text-blue-600">{assignModalComplaint.complaintId || assignModalComplaint.id}</strong> ({assignModalComplaint.category})
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select Municipal Worker:</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white outline-none font-medium"
                >
                  <option value="">-- Choose Field Worker --</option>
                  {workers.map(w => (
                    <option key={w.id || w._id} value={w.id || w._id}>
                      {w.name} - {w.department || 'Field Ops'} ({w.zone || w.id || w._id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setAssignModalComplaint(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignWorker}
                  disabled={!selectedWorkerId}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl ${
                    selectedWorkerId ? 'bg-[#059669] hover:bg-[#047857]' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Confirm Dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERIFICATION INSPECTOR MODAL */}
      <AnimatePresence>
        {selectedVerification && (
          <VerificationModal 
            verification={selectedVerification}
            onClose={() => setSelectedVerification(null)}
            onApprove={(id) => {
              handleDirectApprove(id);
              setSelectedVerification(null);
            }}
            onReject={(id, reason) => {
              setVerifications(prev => prev.map(v => (v._id === id || v.verificationId === id) ? { ...v, status: 'REJECTED', rejectionReason: reason } : v));
              setSelectedVerification(null);
              axios.patch(`/api/verifications/${id}/reject`, { reason }).catch(() => {});
            }}
          />
        )}
      </AnimatePresence>

      {/* COMPLAINT DETAIL VIEW MODAL */}
      <AnimatePresence>
        {selectedComplaintView && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-blue-600 text-sm">
                    {selectedComplaintView.complaintId || selectedComplaintView.id || selectedComplaintView._id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {selectedComplaintView.status || 'PENDING'}
                  </span>
                </div>
                <button onClick={() => setSelectedComplaintView(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo preview if present */}
              {(selectedComplaintView.photoUrl || selectedComplaintView.citizenPhoto) && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-50">
                  <img 
                    src={selectedComplaintView.photoUrl || selectedComplaintView.citizenPhoto} 
                    alt="Complaint Evidence" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Category</div>
                  <div className="font-bold text-slate-800">{selectedComplaintView.category || 'Civic Infrastructure'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Priority</div>
                  <div className="font-bold text-slate-800">{selectedComplaintView.priority || 'Medium'}</div>
                </div>
                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1 col-span-2">
                  <div className="flex items-center justify-between text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      AI Priority Classification
                    </span>
                    <span>{selectedComplaintView.aiSeverityScore ? `${selectedComplaintView.aiSeverityScore}% Severity` : 'AI Evaluated'}</span>
                  </div>
                  <div className="text-xs text-purple-900 font-medium leading-relaxed">
                    {selectedComplaintView.aiPriorityReason || `Evaluated as ${selectedComplaintView.priority || 'Medium'} priority by CityConnectAI Priority Engine based on civic risk and severity.`}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 col-span-2">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Reported Address</div>
                  <div className="font-medium text-slate-800 text-xs">
                    {selectedComplaintView.location?.address || selectedComplaintView.citizenLocation?.address || 'Municipal Ward Area'}
                  </div>
                </div>
              </div>

              {selectedComplaintView.description && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Citizen Description</div>
                  <div className="text-slate-700 leading-relaxed font-medium">{selectedComplaintView.description}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedComplaintView(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                {(!selectedComplaintView.assignedWorkerId || selectedComplaintView.assignedWorkerId === 'Unassigned') && (
                  <button
                    onClick={() => {
                      const comp = selectedComplaintView;
                      setSelectedComplaintView(null);
                      setAssignModalComplaint(comp);
                    }}
                    className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Field Worker
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
