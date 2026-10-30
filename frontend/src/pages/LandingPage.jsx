import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, ShieldCheck, Sparkles, MapPin, Truck, Bot, ArrowRight, 
  AlertTriangle, CheckCircle2, CloudRain, Cpu, BarChart3, ChevronRight, User, Eye, Activity, Flame
} from 'lucide-react';
import axios from 'axios';
import LeafletMap from '../components/LeafletMap';

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    activeTasks: 0,
    resolvedIssues: 0,
    verificationRate: 0,
    criticalAlerts: 0,
    cleanlinessScore: 100
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, compRes] = await Promise.all([
          axios.get('/api/admin/statistics'),
          axios.get('/api/complaints?all=true')
        ]);
        setStats(statsRes.data);
        setComplaints(compRes.data || []);
      } catch (err) {
        console.warn("Using defaults while loading DB records");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#17201C] overflow-hidden">
      
      {/* 01. FULL-SCREEN HERO SECTION */}
      <section className="relative min-h-[90vh] pt-12 pb-20 px-4 md:px-8 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50/40 via-transparent to-[#F5F7F4]">
        
        {/* Trust Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/60 border border-emerald-200 text-brand-emerald text-xs font-semibold mb-6 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />
          <span>AI-Powered • GPS Verified • Real-Time • Citizen-First</span>
        </motion.div>

        {/* Hero Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-center tracking-tight text-brand-text max-w-4xl uppercase leading-none mb-6"
        >
          SMARTER CITY. <br />
          <span className="text-brand-emerald bg-clip-text text-transparent bg-gradient-to-r from-[#087F5B] to-[#0EA5A4]">
            CLEANER TOMORROW.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-xl text-center text-brand-muted max-w-2xl font-normal leading-relaxed mb-8"
        >
          AI-powered civic maintenance that connects citizens, field workers and municipal teams in one intelligent platform.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16"
        >
          <Link
            to="/citizen"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-emerald text-white font-bold text-sm hover:bg-[#066749] shadow-lg shadow-brand-emerald/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Report an Issue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/admin"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-brand-border text-brand-text font-bold text-sm hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4 text-brand-blue" />
            <span>Explore City Operations</span>
          </Link>
        </motion.div>

        {/* HERO CITY ANIMATED VISUALIZATION (Requirement #9) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="w-full max-w-5xl h-[320px] md:h-[400px] bg-gradient-to-b from-sky-50 via-emerald-50/20 to-emerald-100/40 rounded-card border border-brand-border shadow-xl relative overflow-hidden flex flex-col justify-end"
        >
          {/* Animated Sky Clouds */}
          <div className="absolute top-4 left-10 w-24 h-8 bg-white/70 rounded-full blur-xs animate-[pulse_4s_infinite]"></div>
          <div className="absolute top-12 right-20 w-32 h-10 bg-white/80 rounded-full blur-xs animate-[pulse_6s_infinite]"></div>

          {/* AI Scanning Circle Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-emerald/10 to-transparent pointer-events-none animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>

          {/* Buildings Backdrop (SVG) */}
          <div className="flex items-end justify-center gap-4 px-8 pb-12 opacity-85">
            <div className="w-16 h-48 bg-slate-300 rounded-t-xl relative border-t-2 border-slate-400">
              <div className="grid grid-cols-2 gap-1 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-3 bg-yellow-100/80 rounded-xs"></div>
                ))}
              </div>
            </div>
            <div className="w-24 h-64 bg-slate-400 rounded-t-2xl relative border-t-2 border-slate-500">
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="h-3 bg-blue-100/90 rounded-xs"></div>
                ))}
              </div>
              {/* GPS Pulsing Marker on Roof */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className="w-6 h-6 rounded-full bg-brand-emerald/40 animate-ping absolute"></span>
                <MapPin className="w-6 h-6 text-brand-emerald drop-shadow-md" />
              </div>
            </div>
            <div className="w-20 h-56 bg-slate-300 rounded-t-xl relative border-t-2 border-slate-400">
              <div className="grid grid-cols-2 gap-1.5 p-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-3 bg-yellow-100/80 rounded-xs"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Environmental Trees & Greenery */}
          <div className="absolute bottom-12 left-6 flex gap-2">
            <div className="w-8 h-12 bg-emerald-600 rounded-t-full"></div>
            <div className="w-10 h-16 bg-emerald-700 rounded-t-full"></div>
          </div>
          <div className="absolute bottom-12 right-12 flex gap-2">
            <div className="w-10 h-16 bg-emerald-600 rounded-t-full"></div>
            <div className="w-8 h-12 bg-emerald-700 rounded-t-full"></div>
          </div>

          {/* Road Strip with Moving Vehicles */}
          <div className="w-full h-14 bg-slate-700 border-t-4 border-slate-600 relative flex items-center overflow-hidden">
            {/* Road Dash Lines */}
            <div className="w-full border-t-2 border-dashed border-yellow-400/80"></div>
            
            {/* Animated Moving Garbage Truck */}
            <div className="absolute left-0 animate-[moveTruck_12s_linear_infinite] flex items-center gap-1 text-white bg-brand-emerald px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
              <Truck className="w-5 h-5 text-white" />
              <span>CLEAN CITY AI TRUCK</span>
            </div>

            {/* Worker Avatar */}
            <div className="absolute right-1/4 flex items-center gap-1 bg-brand-blue text-white px-2 py-0.5 rounded-full text-[11px] font-bold shadow-md">
              <User className="w-3.5 h-3.5" />
              <span>Worker #04</span>
            </div>
          </div>

          {/* Banner Tag */}
          <div className="bg-brand-emerald py-2 px-4 text-center text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2">
            <Bot className="w-4 h-4" /> AI SCANNING ACTIVE • LIVE MUNICIPAL GEOLOCATION
          </div>
        </motion.div>
      </section>

      {/* 02. LIVE CITY GIS SECTION (Requirement #10) */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-brand-text mb-3">Your City. In Real Time.</h2>
          <p className="text-brand-muted text-sm">
            One intelligent GIS overview of citizen complaints, active field workers, garbage vehicles, and civic risk zones.
          </p>
        </div>

        <LeafletMap complaints={complaints} height="480px" />
      </section>

      {/* 03. IMPACT STATISTICS SECTION (Requirement #11 - Live MongoDB Calculated) */}
      <section className="py-12 px-4 md:px-8 bg-white border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-card bg-brand-bg border border-brand-border text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-brand-emerald mb-1">
                {stats.totalComplaints}
              </div>
              <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Total Complaints</div>
            </div>
            <div className="p-6 rounded-card bg-brand-bg border border-brand-border text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-brand-blue mb-1">
                {stats.activeTasks}
              </div>
              <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Active Field Tasks</div>
            </div>
            <div className="p-6 rounded-card bg-brand-bg border border-brand-border text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-brand-success mb-1">
                {stats.resolvedIssues}
              </div>
              <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Resolved Issues</div>
            </div>
            <div className="p-6 rounded-card bg-brand-bg border border-brand-border text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">
                {stats.verificationRate}%
              </div>
              <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider">AI Verification Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* 04. AI INTELLIGENCE SECTION (Requirement #12) */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text mb-3">
            AI That Doesn't Just React. <br />
            <span className="text-brand-blue">It Predicts.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-card bg-white border border-brand-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-text mb-2">AI Complaint Intelligence</h3>
            <p className="text-xs text-brand-muted leading-relaxed mb-6">
              Automatic classification, priority indexing, and intelligent department assignment upon submission.
            </p>
            <div className="bg-brand-bg p-3 rounded-xl text-[11px] font-mono text-brand-muted space-y-1.5 border border-brand-border">
              <div>Complaint → Classification</div>
              <div>Priority → Department</div>
              <div className="text-brand-emerald font-bold">✓ Automated Dispatch</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-card bg-white border border-brand-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-emerald flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-text mb-2">Predictive Maintenance</h3>
            <p className="text-xs text-brand-muted leading-relaxed mb-6">
              Historical issue analysis combined with GIS location density to predict overflowing garbage bins and road defects.
            </p>
            <div className="bg-brand-bg p-3 rounded-xl text-[11px] font-mono text-brand-muted space-y-1.5 border border-brand-border">
              <div>History + GIS Data</div>
              <div>+ Weather Correlator</div>
              <div className="text-brand-blue font-bold">→ Risk Map Generated</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-card bg-white border border-brand-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-text mb-2">AI Hotspot &amp; Density Engine</h3>
            <p className="text-xs text-brand-muted leading-relaxed mb-6">
              Spatial clustering detects neighborhood complaint clusters in real-time. Automatically triggers high-priority alerts when an area exceeds 5 complaints.
            </p>
            <div className="bg-brand-bg p-3 rounded-xl text-[11px] font-mono text-brand-muted space-y-1.5 border border-brand-border">
              <div>Neighborhood Clustering</div>
              <div>&gt; 5 Complaint Rule</div>
              <div className="text-amber-600 font-bold">→ Priority Rapid Squad Dispatch</div>
            </div>
          </div>
        </div>
      </section>

      {/* 05. PROOF-OF-WORK SECTION (Requirement #13) */}
      <section className="py-20 px-4 md:px-8 bg-brand-bg border-t border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text mb-3">
              Work Done. <span className="text-brand-emerald">Proof Verified.</span>
            </h2>
            <p className="text-brand-muted text-sm">
              AI-powered evidence verification compares Worker BEFORE vs Worker AFTER photos with mandatory backend GPS distance checks (&lt;9m).
            </p>
          </div>

          <div className="bg-white rounded-card border border-brand-border p-6 md:p-10 shadow-lg max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 rounded-2xl bg-gray-50 border border-brand-border text-center">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Worker BEFORE Photo</div>
                <div className="h-44 bg-slate-800 rounded-xl flex items-center justify-center text-white text-xs font-mono">
                  📷 Uncleaned Site Capture
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-brand-border text-center">
                <div className="text-xs font-bold text-brand-emerald uppercase mb-2">Worker AFTER Photo</div>
                <div className="h-44 bg-emerald-900/80 rounded-xl flex items-center justify-center text-white text-xs font-mono border-2 border-brand-emerald">
                  ✨ Cleaned Site Capture
                </div>
              </div>
            </div>

            <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xs text-brand-muted">Image Analysis</div>
                <div className="text-sm font-bold text-brand-success mt-1">✓ Passed (94%)</div>
              </div>
              <div>
                <div className="text-xs text-brand-muted">GPS Distance</div>
                <div className="text-sm font-bold text-brand-success mt-1">✓ 7.4 meters (&lt;9m)</div>
              </div>
              <div>
                <div className="text-xs text-brand-muted">Live Camera</div>
                <div className="text-sm font-bold text-brand-success mt-1">✓ Verified</div>
              </div>
              <div>
                <div className="text-xs text-brand-muted">Status</div>
                <div className="text-sm font-bold text-brand-blue mt-1">Ready for Admin</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06. THREE ROLE SYSTEM SECTION (Requirement #14) */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-brand-text mb-3">Choose Your Role</h2>
          <p className="text-brand-muted text-sm">Experience the platform built for all municipal stakeholders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CITIZEN */}
          <Link 
            to="/citizen"
            className="p-8 rounded-card bg-white border border-brand-border hover:border-brand-emerald shadow-xs hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-brand-emerald flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-2">CITIZEN PORTAL</h3>
              <p className="text-xs text-brand-muted leading-relaxed mb-6">
                Report civic issues in seconds with auto GPS location, track status in real-time, and chat with AI assistant.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-emerald group-hover:translate-x-1 transition-transform">
              <span>Access Citizen Portal</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* WORKER */}
          <Link 
            to="/worker"
            className="p-8 rounded-card bg-white border border-brand-border hover:border-brand-blue shadow-xs hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-2">WORKER FIELD CONSOLE</h3>
              <p className="text-xs text-brand-muted leading-relaxed mb-6">
                Mobile-first field console for workers to view tasks, navigate with GPS, and record Before/After evidence.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-blue group-hover:translate-x-1 transition-transform">
              <span>Access Worker Console</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* ADMIN */}
          <Link 
            to="/admin"
            className="p-8 rounded-card bg-white border border-brand-border hover:border-purple-600 shadow-xs hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-2">MUNICIPAL COMMAND CENTER</h3>
              <p className="text-xs text-brand-muted leading-relaxed mb-6">
                Comprehensive operations dashboard for city administrators, proof verification, worker dispatch, and analytics.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
              <span>Access Admin Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* Keyframe Styles for Hero Truck Animation */}
      <style>{`
        @keyframes moveTruck {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(1000%); }
        }
      `}</style>

    </div>
  );
}
