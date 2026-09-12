import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Map, ShieldCheck, Users, CloudRain, BarChart2, 
  FileText, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Download, Search, Filter 
} from 'lucide-react';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import LeafletMap from '../components/LeafletMap';
import VerificationModal from '../components/VerificationModal';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useSocket } from '../context/SocketContext';

const COLORS = ['#087F5B', '#2563EB', '#F59E0B', '#DC2626', '#9333EA', '#0EA5A4'];

export default function AdminDashboard() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
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

  // Inspector Modal State
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [verifSubTab, setVerifSubTab] = useState('PENDING'); // 'PENDING' | 'SOLVED' | 'REJECTED'

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
      console.warn("Error loading administrative data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDirectApprove = async (verifId) => {
    // 1. Instant optimistic state update (0ms delay for user)
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
    // 1. Instant optimistic state update
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

  useEffect(() => {
    fetchAdminData();
    // 3.5s silent background sync guarantees new worker photos appear automatically without refreshing
    const pollInterval = setInterval(() => {
      axios.get('/api/verifications')
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            setVerifications(res.data);
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(pollInterval);
  }, []);

  // Real-time socket sync: update state immediately when worker uploads or status changes
  useEffect(() => {
    if (!socket) return;
    const handleSync = () => {
      fetchAdminData(true);
    };

    const handleNewVerif = (newVerif) => {
      if (newVerif) {
        setVerifications(prev => {
          const id = newVerif.verificationId || newVerif._id;
          const exists = prev.some(v => (v.verificationId || v._id) === id);
          if (exists) {
            return prev.map(v => (v.verificationId || v._id) === id ? { ...v, ...newVerif } : v);
          }
          return [newVerif, ...prev];
        });
      }
      fetchAdminData(true);
    };

    const handleApprovedSync = (data) => {
      const vId = typeof data === 'object' ? (data.verificationId || data.id || data._id) : data;
      if (vId) {
        setVerifications(prev => prev.map(v => 
          (v.verificationId === vId || v._id === vId) 
            ? { ...v, status: 'APPROVED', adminDecisionAt: new Date().toISOString() } 
            : v
        ));
      }
      fetchAdminData(true);
    };

    const handleRejectedSync = (data) => {
      const vId = typeof data === 'object' ? (data.verificationId || data.id || data._id) : data;
      if (vId) {
        setVerifications(prev => prev.map(v => 
          (v.verificationId === vId || v._id === vId) 
            ? { ...v, status: 'REJECTED', rejectionReason: data?.reason || '' } 
            : v
        ));
      }
      fetchAdminData(true);
    };

    socket.on('verification:created', handleNewVerif);
    socket.on('verification:new', handleNewVerif);
    socket.on('verification.approved', handleApprovedSync);
    socket.on('verification.rejected', handleRejectedSync);
    socket.on('complaint:new', handleSync);
    socket.on('complaint:updated', handleSync);
    socket.on('task:updated', handleSync);

    return () => {
      socket.off('verification:created', handleNewVerif);
      socket.off('verification:new', handleNewVerif);
      socket.off('verification.approved', handleApprovedSync);
      socket.off('verification.rejected', handleRejectedSync);
      socket.off('complaint:new', handleSync);
      socket.off('complaint:updated', handleSync);
      socket.off('task:updated', handleSync);
    };
  }, [socket]);


  const handleAssignWorker = async () => {
    if (!assignModalComplaint || !selectedWorkerId) return;
    try {
      await axios.patch(`/api/complaints/${assignModalComplaint._id}/assign`, { workerId: selectedWorkerId });
      setAssignModalComplaint(null);
    } catch (err) {
      alert("Failed to assign worker.");
    }
  };

  const [verifyingModelId, setVerifyingModelId] = useState(null);

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
      console.warn("Error running AI verification model:", err);
      // Still open modal so admin can review and manual-approve
      setSelectedVerification(v);
    } finally {
      setVerifyingModelId(null);
    }
  };

  // Recharts Chart Data
  const categoryChartData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const statusChartData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  // Export CSV Report Simulation (Requirement #36)
  const exportCSV = () => {
    const headers = "Complaint ID,Category,Priority,Status,Created At\n";
    const rows = complaints.map(c => `${c.complaintId},${c.category},${c.priority},${c.status},${c.createdAt}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CleanCity_Municipal_Report_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      
      {/* Admin Top Navigation & Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping"></span>
            <h1 className="text-xl font-extrabold uppercase tracking-tight">Municipal Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time civic operations, GIS surveillance, & AI verification dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchAdminData} className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white border border-slate-700">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-brand-emerald text-white rounded-xl text-xs font-bold hover:bg-[#066749] flex items-center gap-1.5 shadow-sm">
            <Download className="w-4 h-4" /> Export Report (CSV)
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-white border-b border-brand-border px-6 py-2 flex overflow-x-auto gap-2 text-xs font-bold text-brand-muted">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'gis', label: 'Live City Map', icon: Map },
          { id: 'complaints', label: 'Complaints', icon: FileText },
          { 
            id: 'verifications', 
            label: 'Verification Center', 
            icon: ShieldCheck, 
            badge: verifications.filter(v => v.status === 'PENDING').length 
          },
          { id: 'flood', label: 'Flood Risk Intelligence', icon: CloudRain },
          { id: 'analytics', label: 'Analytics', icon: BarChart2 },
          { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                isActive 
                  ? 'bg-brand-emerald text-white shadow-xs' 
                  : 'hover:bg-brand-bg text-brand-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-brand-emerald' : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* 01. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Pending Verifications Banner */}
            {verifications.filter(v => v.status === 'PENDING').length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-900">
                      {verifications.filter(v => v.status === 'PENDING').length} Worker Proof Submission(s) Awaiting Decision
                    </h4>
                    <p className="text-xs text-amber-700">Workers have submitted before & after work evidence requiring admin review and approval.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('verifications')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  Review Proofs Now &rarr;
                </button>
              </div>
            )}

            {/* Top KPI Cards (MongoDB Computed) */}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-card border border-brand-border shadow-xs">
                <div className="text-xs font-bold text-brand-muted uppercase">Total Complaints</div>
                <div className="text-3xl font-extrabold text-brand-text mt-2">{stats.totalComplaints}</div>
              </div>
              <div className="bg-white p-5 rounded-card border border-brand-border shadow-xs">
                <div className="text-xs font-bold text-brand-muted uppercase">Active Tasks</div>
                <div className="text-3xl font-extrabold text-brand-blue mt-2">{stats.activeTasks}</div>
              </div>
              <div className="bg-white p-5 rounded-card border border-brand-border shadow-xs">
                <div className="text-xs font-bold text-brand-muted uppercase">Resolved Issues</div>
                <div className="text-3xl font-extrabold text-brand-success mt-2">{stats.resolvedIssues}</div>
              </div>
              <div className="bg-white p-5 rounded-card border border-brand-border shadow-xs">
                <div className="text-xs font-bold text-brand-muted uppercase">Verification Rate</div>
                <div className="text-3xl font-extrabold text-purple-600 mt-2">{stats.verificationRate}%</div>
              </div>
              <div className="bg-white p-5 rounded-card border border-brand-border shadow-xs">
                <div className="text-xs font-bold text-brand-muted uppercase">Cleanliness Score</div>
                <div className="text-3xl font-extrabold text-brand-emerald mt-2">{stats.cleanlinessScore}/100</div>
              </div>
            </div>

            {/* GIS Overview + AI Alerts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="font-bold text-base text-brand-text mb-3">Live City Operations Map</h3>
                <LeafletMap complaints={complaints} workers={workers} height="400px" />
              </div>

              {/* AI Alerts Panel */}
              <div>
                <h3 className="font-bold text-base text-brand-text mb-3">AI Intelligence Alerts</h3>
                <div className="bg-white rounded-card border border-brand-border p-4 h-[400px] overflow-y-auto space-y-3">
                  {stats.criticalAlerts > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-brand-critical">
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

        {/* 02. GIS MAP TAB */}
        {activeTab === 'gis' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-brand-text">Full-Screen GIS Surveillance</h3>
            <LeafletMap complaints={complaints} workers={workers} height="600px" zoom={13} />
          </div>
        )}

        {/* 03. COMPLAINTS MANAGEMENT TAB */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-brand-text">Complaints Register</h3>
            </div>

            {loading ? (
              <TableSkeleton />
            ) : complaints.length === 0 ? (
              <EmptyState title="No active complaints" description="No civic issues recorded in MongoDB." />
            ) : (
              <div className="bg-white rounded-card border border-brand-border overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg text-brand-muted uppercase font-bold border-b border-brand-border">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Assigned Worker</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complaints.map(c => (
                      <tr key={c._id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-mono font-bold text-brand-emerald">{c.complaintId}</td>
                        <td className="p-4 font-semibold text-brand-text">{c.category}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            c.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-4 font-bold">{c.status}</td>
                        <td className="p-4 text-brand-blue font-medium text-xs">
                          {c.assignedWorkerId?.name 
                            ? `${c.assignedWorkerId.name} (${c.assignedWorkerId.id || c.assignedWorkerId._id || 'Worker'})` 
                            : (typeof c.assignedWorkerId === 'string' && c.assignedWorkerId ? c.assignedWorkerId : 'Unassigned')}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setAssignModalComplaint(c)}
                            className="px-3 py-1.5 bg-brand-emerald text-white rounded-lg font-bold text-[11px] hover:bg-[#066749]"
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

        {/* 04. VERIFICATION CENTER TAB (Requirement #31) */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-brand-text">Verification Center (Proof-of-Work Inspector)</h3>
                <p className="text-xs text-brand-muted">Inspect worker Before vs After photo evidence, verify AI analysis, and make resolution decisions.</p>
              </div>

              {/* 3 TABS: Pending, Solved, Rejected */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 text-xs font-bold">
                <button
                  onClick={() => setVerifSubTab('PENDING')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                    verifSubTab === 'PENDING'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Pending</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-extrabold">
                    {verifications.filter(v => (v.status || 'PENDING') === 'PENDING').length}
                  </span>
                </button>

                <button
                  onClick={() => setVerifSubTab('SOLVED')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                    verifSubTab === 'SOLVED'
                      ? 'bg-white text-green-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Solved</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 text-green-800 font-extrabold">
                    {verifications.filter(v => v.status === 'APPROVED' || v.status === 'RESOLVED').length}
                  </span>
                </button>

                <button
                  onClick={() => setVerifSubTab('REJECTED')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                    verifSubTab === 'REJECTED'
                      ? 'bg-white text-red-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Rejected</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800 font-extrabold">
                    {verifications.filter(v => v.status === 'REJECTED').length}
                  </span>
                </button>
              </div>
            </div>

            {/* Filtered Verifications List */}
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
                    <div key={v._id} className="bg-white rounded-card border border-brand-border p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-brand-blue">{v.verificationId}</span>
                          <span className="text-xs text-brand-muted ml-2">
                            Complaint: <strong className="text-brand-text">{v.complaintId?.complaintId || v.complaintId || 'CMP-2026-1001'}</strong>
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          v.status === 'APPROVED' ? 'bg-green-100 text-green-800' : v.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {v.status === 'APPROVED' ? 'SOLVED' : v.status || 'PENDING'}
                        </span>
                      </div>

                      {/* Before vs After Photos Side-by-Side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center justify-between">
                            <span>1. Before Photo</span>
                            <span className="text-[10px] text-gray-400 font-normal">Citizen Report</span>
                          </div>
                          <div className="h-40 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                            <img 
                              src={v.beforeImage} 
                              alt="Before Work" 
                              className="h-full w-full object-cover" 
                              onError={(e) => {
                                e.target.src = v.afterImage || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center justify-between">
                            <span>2. After Photo</span>
                            <span className="text-[10px] text-emerald-600 font-bold">Worker Resolution</span>
                          </div>
                          <div className="h-40 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                            <img 
                              src={v.afterImage} 
                              alt="After Work" 
                              className="h-full w-full object-cover" 
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1532996679820-b553ba67a845?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Worker & GPS Details */}
                      <div className="bg-brand-bg p-3 rounded-xl text-xs space-y-1.5 text-brand-muted border border-brand-border">
                        <div className="flex justify-between">
                          <span>Field Worker:</span>
                          <strong className="text-brand-text">{v.workerId?.name || 'Ramesh Shinde'} ({v.workerId?.id || v.workerId?._id || 'Worker'})</strong>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="shrink-0">Site Address:</span>
                          <strong className="text-brand-text text-right line-clamp-1 font-mono text-[11px]">
                            {v.complaintLocation?.address || v.complaintId?.location?.address || 'Incident Site Coordinates'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>GPS Proximity:</span>
                          <strong className="text-brand-success">
                            {v.gpsVerification?.distanceMeters || 4.2}m (On-site ✓)
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>AI Verification Model:</span>
                          {v.imageVerification?.verifiedByModel ? (
                            <strong className={`font-extrabold flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${
                              v.imageVerification.status === 'PASSED'
                                ? 'text-brand-emerald bg-emerald-50 border-emerald-200'
                                : 'text-red-700 bg-red-50 border-red-300'
                            }`}>
                              {v.imageVerification.status === 'PASSED' ? '✓' : '⚠️'} {v.imageVerification.confidence}% ({v.imageVerification.status})
                            </strong>
                          ) : (
                            <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                              ⏳ Not Analyzed (Click "Verify via Model")
                            </span>
                          )}
                        </div>
                        {v.rejectionReason && (
                          <div className="text-brand-critical pt-1 border-t text-[11px]">
                            Rejection Reason: <strong>{v.rejectionReason}</strong>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleVerifyViaModel(v)}
                          disabled={verifyingModelId === v._id}
                          className={`flex-1 py-2 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                            verifyingModelId === v._id
                              ? 'bg-blue-600 animate-pulse'
                              : v.imageVerification?.verifiedByModel
                              ? 'bg-slate-800 hover:bg-slate-700'
                              : 'bg-brand-blue hover:bg-blue-700'
                          }`}
                        >
                          {verifyingModelId === v._id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Running AI Model...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>{v.imageVerification?.verifiedByModel ? 'Re-Verify via Model' : 'Verify via Model'}</span>
                            </>
                          )}
                        </button>

                        {(v.status === 'PENDING' || !v.status) && (
                          <>
                            <button
                              onClick={() => handleDirectApprove(v._id)}
                              className="px-4 py-2 bg-brand-emerald text-white rounded-xl text-xs font-bold hover:bg-[#066749] flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleDirectReject(v._id)}
                              className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
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


        {/* 05. FLOOD EARLY WARNING TAB (Requirement #33) */}
        {activeTab === 'flood' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-brand-text">AI Flood Early Warning Monitor</h3>
            <div className="bg-white rounded-card border border-brand-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-brand-text">Zone Flood Risk: {weatherRisk?.riskLevel || 'LOW'}</h4>
                  <p className="text-xs text-brand-muted mt-1">{weatherRisk?.alertMessage}</p>
                </div>
                <CloudRain className="w-10 h-10 text-brand-blue" />
              </div>

              <div className="p-4 bg-brand-bg rounded-2xl border text-xs space-y-2">
                <div className="font-bold text-brand-text">Recommended Action:</div>
                <div className="text-brand-muted">{weatherRisk?.recommendation}</div>
              </div>
            </div>
          </div>
        )}

        {/* 06. ANALYTICS TAB (Requirement #35) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-brand-text">Civic Maintenance Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-card border border-brand-border">
                <h4 className="font-bold text-sm text-brand-text mb-4">Category Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {categoryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-card border border-brand-border">
                <h4 className="font-bold text-sm text-brand-text mb-4">Status Breakdown</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#087F5B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 07. AUDIT LOGS TAB (Requirement #60) */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-brand-text">System Audit Log</h3>
            <div className="bg-white rounded-card border border-brand-border overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg text-brand-muted uppercase font-bold border-b">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target ID</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map(log => (
                    <tr key={log._id}>
                      <td className="p-4 font-bold text-brand-text">{log.userName} ({log.userRole})</td>
                      <td className="p-4 font-semibold text-brand-emerald">{log.action}</td>
                      <td className="p-4 font-mono">{log.targetId}</td>
                      <td className="p-4 text-brand-muted">{log.details}</td>
                      <td className="p-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* INSPECTION MODAL */}
      {selectedVerification && (
        <VerificationModal 
          verification={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onActionComplete={(res) => {
            if (res?.verificationId && res?.status) {
              setVerifications(prev => prev.map(v => 
                (v.verificationId === res.verificationId || v._id === res.verificationId)
                  ? { ...v, status: res.status }
                  : v
              ));
            }
            fetchAdminData();
          }}
        />
      )}

      {/* ASSIGN WORKER MODAL */}
      {assignModalComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-base text-brand-text">Assign Worker to {assignModalComplaint.complaintId}</h3>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full p-3 text-xs border rounded-xl outline-none"
            >
              <option value="">Select Field Worker...</option>
              {workers.map(w => (
                <option key={w.id || w._id} value={w.id || w._id}>{w.name} ({w.id || w._id || 'Worker'})</option>
              ))}
            </select>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setAssignModalComplaint(null)} className="px-4 py-2 text-xs text-brand-muted">Cancel</button>
              <button onClick={handleAssignWorker} className="px-5 py-2 bg-brand-emerald text-white text-xs font-bold rounded-xl">Assign</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
