import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Map, ShieldCheck, Users, CloudRain, BarChart2, 
  FileText, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, RefreshCw, 
  Download, Search, Filter, PieChart as PieChartIcon, TrendingUp, 
  Building2, Bell, ChevronDown, Check, ArrowRight, Eye, Camera, 
  Wrench, Clock, Activity, Zap, HardHat, Compass, AlertOctagon, CheckSquare
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

  // Inspector & Assignment Modals State
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [verifSubTab, setVerifSubTab] = useState('PENDING'); // 'PENDING' | 'SOLVED' | 'REJECTED'
  const [verifyingModelId, setVerifyingModelId] = useState(null);

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
      
      {/* 1. TOP NAVBAR (Cohesive with Worker & Citizen portals) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
              CLEAN CITY AI
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
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR (Matching Clean City AI Design Language) */}
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
              onClick={() => setActiveTab('flood')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'flood'
                  ? 'bg-[#059669] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <CloudRain className="w-4 h-4 shrink-0" />
                <span>Flood Risk Warning</span>
              </div>
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
                  <span>Surveillance Online</span>
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
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

          {/* TAB: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Complaints Register</h3>
              </div>

              {loading ? (
                <TableSkeleton />
              ) : complaints.length === 0 ? (
                <EmptyState title="No active complaints" description="No civic issues recorded in database." />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Assigned Worker</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {complaints.map(c => (
                        <tr key={c._id || c.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-blue-600">{c.complaintId || c.id}</td>
                          <td className="p-4 font-semibold text-slate-800">{c.category}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              c.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {c.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="p-4 font-bold">{c.status}</td>
                          <td className="p-4 text-slate-600 font-medium text-xs">
                            {c.assignedWorkerId?.name 
                              ? `${c.assignedWorkerId.name} (${c.assignedWorkerId.id || c.assignedWorkerId._id || 'Worker'})` 
                              : (typeof c.assignedWorkerId === 'string' && c.assignedWorkerId ? c.assignedWorkerId : 'Unassigned')}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setAssignModalComplaint(c)}
                              className="px-3 py-1.5 bg-[#059669] text-white rounded-lg font-bold text-[11px] hover:bg-[#047857] cursor-pointer"
                            >
                              Assign Worker
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

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

          {/* TAB: FLOOD RISK */}
          {activeTab === 'flood' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900">AI Flood Early Warning Intelligence</h3>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Zone Flood Risk: {weatherRisk?.riskLevel || 'LOW'}</h4>
                    <p className="text-xs text-slate-500 mt-1">{weatherRisk?.alertMessage}</p>
                  </div>
                  <CloudRain className="w-10 h-10 text-blue-600" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-800">Automated Recommendation:</div>
                  <div className="text-slate-600">{weatherRisk?.recommendation}</div>
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

    </div>
  );
}
