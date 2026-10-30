import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, ShieldCheck, Sparkles, MapPin, Truck, Bot, ArrowRight, 
  AlertTriangle, CheckCircle2, Cpu, BarChart3, ChevronRight, User, Eye, 
  Activity, Flame, Megaphone, Camera, Navigation, Layers, ShieldAlert,
  Clock, CheckCircle, FileText, Smartphone, HardHat
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
    <div id="home" className="min-h-screen bg-[#FAF7F2] text-[#1C1917] overflow-x-hidden selection:bg-[#A34B24] selection:text-white">
      
      {/* =========================================================================
          01. HERO SECTION (Matching Mockup: Angled Divider, High-Res City, Floating Card)
          ========================================================================= */}
      <section className="relative bg-[#FAF7F2] overflow-hidden border-b border-[#EBE3D7]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[620px]">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-6 px-6 sm:px-8 lg:px-12 py-12 lg:py-20 flex flex-col justify-center z-10">
            
            {/* Tagline Pill */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#78716C] mb-4 select-none"
            >
              <span>Cleaner Cities</span>
              <span className="text-[#A34B24]">•</span>
              <span>Safer Communities</span>
              <span className="text-[#A34B24]">•</span>
              <span>Smarter Governance</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6"
            >
              Cleaner Cities <br />
              Through Smarter <br />
              <span className="text-[#A34B24]">Collaboration.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg mb-8"
            >
              An AI-powered platform that connects citizens, field workers and municipal teams to manage civic issues efficiently, transparently and in real-time.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3.5"
            >
              <Link
                to="/citizen"
                className="px-6 py-3.5 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs font-bold shadow-md shadow-[#A34B24]/20 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Report an Issue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-[#EBE3D7] text-slate-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-[#A34B24]" />
                <span>Explore City Operations</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Ultra-HD Panoramic City Image with crisp floating capability card */}
          <div className="lg:col-span-6 relative min-h-[420px] lg:min-h-full">
            <div className="absolute inset-0 w-full h-full">
              <img
                src="/hero-city-hd.jpg"
                alt="Clean Modern City Boulevard"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-transparent to-transparent w-24"></div>
            </div>

            {/* Floating Capabilities Card (matching top-right mockup pill) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute top-6 right-6 sm:top-10 sm:right-10 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-5 shadow-xl max-w-xs space-y-3 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">GPS Verified Locations</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">AI Image Analysis</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Real-Time Tracking</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Transparent Governance</span>
              </div>
            </motion.div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          02. FOUR CORE PILLARS (Horizontal Row under Hero, matching mockup)
          ========================================================================= */}
      <section className="bg-white border-b border-[#EBE3D7] py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1 */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Cleaner Environment</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Faster resolution of civic issues</p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Citizen Participation</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">A more informed and engaged community</p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Data-Driven Governance</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time insights and analytics</p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Accountability &amp; Transparency</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified evidence and audit trails</p>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          03. CHOOSE YOUR PORTAL / "BUILT FOR EVERY STAKEHOLDER" (Matching Mockup Side-by-Side Layout)
          ========================================================================= */}
      <section id="features" className="py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-10">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#78716C] mb-1">
            Choose Your Portal
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Every Stakeholder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Dedicated tools for citizens, field workers and municipal teams.
          </p>
        </div>

        {/* 3 Portal Cards - matching the side-by-side layout in the mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CARD 1: CITIZEN PORTAL */}
          <div className="bg-white rounded-2xl border border-[#EBE3D7] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center mb-3">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Citizen Portal</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Report civic issues, track status, and stay informed about your city.
                </p>
                <Link
                  to="/citizen"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs font-bold shadow-2xs transition-all"
                >
                  <span>Access Citizen Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Cropped Mockup Image */}
              <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl overflow-hidden border border-[#EBE3D7] shrink-0 bg-slate-100 shadow-2xs">
                <img 
                  src="/citizen-card.jpg" 
                  alt="Citizen Portal"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: WORKER FIELD CONSOLE */}
          <div className="bg-white rounded-2xl border border-[#EBE3D7] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <HardHat className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Worker Field Console</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  View assigned tasks, update work status, and upload before/after evidence.
                </p>
                <Link
                  to="/worker"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs font-bold shadow-2xs transition-all"
                >
                  <span>Access Worker Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Cropped Mockup Image */}
              <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl overflow-hidden border border-[#EBE3D7] shrink-0 bg-slate-100 shadow-2xs">
                <img 
                  src="/worker-card.jpg" 
                  alt="Worker Field Console"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: MUNICIPAL COMMAND CENTER */}
          <div className="bg-white rounded-2xl border border-[#EBE3D7] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Municipal Command Center</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Monitor complaints, verify completed work, view GIS maps and analyze city data.
                </p>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs font-bold shadow-2xs transition-all"
                >
                  <span>Access Admin Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Cropped Mockup Image */}
              <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl overflow-hidden border border-[#EBE3D7] shrink-0 bg-slate-100 shadow-2xs">
                <img 
                  src="/command-card.jpg" 
                  alt="Municipal Command Center"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          04. AI VERIFICATION IN ACTION / "FROM ISSUE TO VERIFIED RESOLUTION"
          ========================================================================= */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 md:px-8 bg-white border-y border-[#EBE3D7]">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="mb-12">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#78716C] mb-1">
              AI Verification in Action
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Issue to Verified Resolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Our AI-powered verification system compares before and after images, validates GPS location and detects unresolved or fake submissions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 8 Cols: Side-by-Side Proof Comparison (Before -> After) */}
            <div className="lg:col-span-8 bg-[#FAF7F2] p-4 sm:p-6 rounded-2xl border border-[#EBE3D7]">
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 sm:gap-4 items-center">
                
                {/* Before Photo */}
                <div className="sm:col-span-5 relative rounded-xl overflow-hidden border border-slate-300 shadow-sm h-52 sm:h-56 bg-slate-900">
                  <img 
                    src="/before-pothole.jpg"
                    alt="Pothole Issue Before Repair"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-md font-mono">
                    Severe Road Defect • Reported by Citizen
                  </div>
                </div>

                {/* Arrow Divider */}
                <div className="sm:col-span-1 flex items-center justify-center py-2 sm:py-0">
                  <div className="w-8 h-8 rounded-full bg-[#A34B24] text-white flex items-center justify-center shadow-sm">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* After Photo */}
                <div className="sm:col-span-5 relative rounded-xl overflow-hidden border-2 border-[#A34B24] shadow-sm h-52 sm:h-56 bg-slate-900">
                  <img 
                    src="/after-road.jpg"
                    alt="Fresh Asphalt Repaved Road"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-[#A34B24]/90 text-white text-[10px] px-2 py-1 rounded-md font-mono flex items-center justify-between">
                    <span>Clean Surface Repaved</span>
                    <span className="font-bold">SSIM: 94% Match</span>
                  </div>
                </div>

              </div>

              {/* Status bar under Before/After */}
              <div className="mt-4 pt-3 border-t border-[#EBE3D7] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-semibold text-slate-800">YOLOv8 + SSIM Vision Model Verified</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 font-medium text-[11px]">
                  <span>GPS Distance: <strong>3.2m</strong> (&lt;9m rule)</span>
                  <span>AI Recommendation: <strong className="text-emerald-700">APPROVE</strong></span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Vertical Capabilities List (Matching Mockup) */}
            <div className="lg:col-span-4 space-y-4">
              
              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Image Analysis</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Detects and verifies real issues with YOLOv8</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">GPS Validation</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Confirms exact on-site location (&lt;9m)</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Metadata Check</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Validates submission timestamp &amp; EXIF data</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Fraud Detection</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Guards against inverted or invalid photos</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          05. LIVE GIS OPERATIONS MAP & DATABASE KPI COUNTERS
          ========================================================================= */}
      <section id="about" className="py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          
          <div className="p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Complaints</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalComplaints}</div>
            <div className="text-[10px] text-slate-500 mt-1">Live Database Records</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Field Tasks</div>
            <div className="text-3xl font-extrabold text-[#A34B24] mt-1">{stats.activeTasks}</div>
            <div className="text-[10px] text-slate-500 mt-1">Dispatched to Workers</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved Issues</div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{stats.resolvedIssues}</div>
            <div className="text-[10px] text-slate-500 mt-1">Cleaned &amp; Closed</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Verification</div>
            <div className="text-3xl font-extrabold text-blue-700 mt-1">{stats.verificationRate}%</div>
            <div className="text-[10px] text-slate-500 mt-1">Dual AI + GPS Audited</div>
          </div>

        </div>

        {/* Live GIS Map Card */}
        <div className="bg-white rounded-2xl border border-[#EBE3D7] overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-[#EBE3D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#A34B24]" />
                Live City Civic Operations Map
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time incident distribution, worker locations, and hotspot intelligence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE7DC] border border-[#EBE3D7] text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Full GIS Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <LeafletMap complaints={complaints} height="460px" />
        </div>

      </section>


      {/* =========================================================================
          06. CONTACT & MUNICIPAL ACTION BANNER
          ========================================================================= */}
      <section id="contact" className="py-14 px-4 md:px-8 bg-[#FAF0E6] border-t border-[#EBE3D7]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ready to Build a Cleaner, Smarter City?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Join thousands of active citizens, municipal workers, and city administrators working together on CityConnectAI.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/citizen"
              className="px-6 py-3 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs font-bold shadow-md shadow-[#A34B24]/20 transition-all flex items-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              <span>Report an Issue</span>
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#EBE3D7] text-slate-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Login to Portal</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
