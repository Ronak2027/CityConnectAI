import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, ShieldCheck, Sparkles, MapPin, Truck, Bot, ArrowRight, 
  AlertTriangle, CheckCircle2, Cpu, BarChart3, ChevronRight, User, Eye, 
  Activity, Flame, Megaphone, Camera, Navigation, Layers, ShieldAlert,
  Clock, CheckCircle, FileText, Smartphone, HardHat, Leaf, Users
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
          01. HERO SECTION (Pixel-Perfect Mobile & Desktop Match)
          ========================================================================= */}
      <section className="relative bg-[#FAF7F2] overflow-hidden border-b border-[#EBE3D7]">
        
        {/* Mobile & Tablet Background City Image with Smooth Cream Blend */}
        <div className="absolute inset-0 lg:hidden pointer-events-none z-0">
          <img
            src="/hero-city-hd.jpg"
            alt="Clean City Boulevard"
            className="w-full h-full object-cover object-[78%_center]"
          />
          {/* Subtle gradient overlay to keep text ultra crisp on mobile while showing city */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/90 to-[#FAF7F2]/25 sm:via-[#FAF7F2]/80" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[500px] sm:min-h-[560px] lg:min-h-[620px] relative z-10">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-6 px-5 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-20 flex flex-col justify-center">
            
            {/* Tagline & Terracotta Accent Bar */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-600 select-none"
            >
              CLEANER CITIES &nbsp;|&nbsp; SAFER COMMUNITIES
            </motion.div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 }}
              className="w-10 sm:w-12 h-1 bg-[#A34B24] rounded-full mt-2 mb-4 sm:mb-5 origin-left"
            />

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-3 sm:mb-5"
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
              className="text-xs sm:text-sm lg:text-base text-slate-600 font-normal leading-relaxed max-w-md sm:max-w-lg mb-6 sm:mb-8"
            >
              Connects citizens, field workers and municipal teams to manage civic issues efficiently, transparently and in real-time.
            </motion.p>

            {/* CTAs (Stacked on Mobile, Row on Desktop) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <Link
                to="/citizen"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#A34B24]/20 transition-all flex items-center justify-between sm:justify-center gap-3 group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  <span>Report an Issue</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/95 hover:bg-slate-50 border border-[#EBE3D7] text-slate-900 text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center justify-between sm:justify-center gap-3 group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#A34B24]" />
                  <span>Explore City Operations</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#A34B24] group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column (Desktop >= lg): Ultra-HD City Image with Floating Capabilities Pill */}
          <div className="hidden lg:block lg:col-span-6 relative min-h-full">
            <div className="absolute inset-0 w-full h-full">
              <img
                src="/hero-city-hd.jpg"
                alt="Clean Modern City Boulevard"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FAF7F2] to-transparent"></div>
            </div>

            {/* Floating Capabilities Pill Card */}
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
          02. FOUR CORE PILLARS (4-Column Divider Grid Matching Mockup)
          ========================================================================= */}
      <section className="bg-white border-b border-[#EBE3D7] py-4 sm:py-6 px-2 sm:px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-4 divide-x divide-[#EBE3D7]">
          
          {/* Pillar 1 */}
          <div className="px-2 sm:px-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">
              Cleaner<br />Environment
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 hidden md:block">
              Rapid civic issue resolution
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="px-2 sm:px-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">
              Citizen<br />Participation
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 hidden md:block">
              Empowered active community
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="px-2 sm:px-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">
              Data-Driven<br />Governance
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 hidden md:block">
              Real-time analytics &amp; hotspots
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="px-2 sm:px-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">
              Accountability<br className="sm:hidden" /> &amp; Transparency
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 hidden md:block">
              Dual AI &amp; GPS verification
            </p>
          </div>

        </div>
      </section>


      {/* =========================================================================
          03. CHOOSE YOUR PORTAL / "BUILT FOR EVERY STAKEHOLDER" (Mobile Horizontal Pill Cards)
          ========================================================================= */}
      <section id="features" className="py-12 sm:py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-10">
          <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#78716C] mb-1">
            Choose Your Portal
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Every Stakeholder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Dedicated tools for citizens, field workers and municipal teams.
          </p>
        </div>

        {/* 3 Portal Cards - Horizontal Blended Layout matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          
          {/* CARD 1: CITIZEN PORTAL */}
          <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-2xs hover:shadow-md transition-all flex flex-row items-stretch min-h-[140px] sm:min-h-[160px] overflow-hidden group">
            {/* Left Content Area */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between z-10 w-[62%] sm:w-[65%]">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center mb-2.5">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 leading-snug">
                  Citizen Portal
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug line-clamp-2 sm:line-clamp-3">
                  Report civic issues, track status, and stay informed about your city.
                </p>
              </div>

              <Link
                to="/citizen"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#A34B24] hover:text-[#8C3E1B] transition-colors mt-2"
              >
                <span>Access Citizen Portal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Blended Image */}
            <div className="w-[38%] sm:w-[35%] relative shrink-0 overflow-hidden bg-slate-100">
              <img 
                src="/citizen-card.jpg" 
                alt="Citizen Reporting on Smartphone"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* CARD 2: WORKER FIELD CONSOLE */}
          <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-2xs hover:shadow-md transition-all flex flex-row items-stretch min-h-[140px] sm:min-h-[160px] overflow-hidden group">
            {/* Left Content Area */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between z-10 w-[62%] sm:w-[65%]">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <HardHat className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 leading-snug">
                  Worker Field Console
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug line-clamp-2 sm:line-clamp-3">
                  View assigned tasks, update work status, and upload before/after evidence.
                </p>
              </div>

              <Link
                to="/worker"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#0284C7] hover:text-[#0369A1] transition-colors mt-2"
              >
                <span>Access Worker Console</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Blended Image */}
            <div className="w-[38%] sm:w-[35%] relative shrink-0 overflow-hidden bg-slate-100">
              <img 
                src="/worker-card.jpg" 
                alt="Municipal Worker in Safety Vest"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* CARD 3: MUNICIPAL COMMAND CENTER */}
          <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-2xs hover:shadow-md transition-all flex flex-row items-stretch min-h-[140px] sm:min-h-[160px] overflow-hidden group">
            {/* Left Content Area */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between z-10 w-[62%] sm:w-[65%]">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 leading-snug">
                  Municipal Command Center
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug line-clamp-2 sm:line-clamp-3">
                  Monitor complaints, verify completed work, view GIS maps and analyze city data.
                </p>
              </div>

              <Link
                to="/admin"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors mt-2"
              >
                <span>Access Admin Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Blended Image */}
            <div className="w-[38%] sm:w-[35%] relative shrink-0 overflow-hidden bg-slate-100">
              <img 
                src="/command-card.jpg" 
                alt="Admin Multi-Monitor GIS Console"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          04. AI VERIFICATION IN ACTION / "FROM ISSUE TO VERIFIED RESOLUTION"
          ========================================================================= */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 px-4 md:px-8 bg-white border-y border-[#EBE3D7]">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="mb-8 sm:mb-10">
            <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#78716C] mb-1">
              AI Verification in Action
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Issue to Verified Resolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Our AI-powered verification system compares before and after images, validates GPS location and detects unresolved or fake submissions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            {/* Left 8 Cols: Side-by-Side Proof Comparison (Before -> After with Floating Center Arrow) */}
            <div className="lg:col-span-8 bg-[#FAF7F2] p-4 sm:p-6 rounded-2xl border border-[#EBE3D7]">
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 relative items-center">
                
                {/* Before Photo */}
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-slate-300 shadow-2xs bg-slate-900">
                  <img 
                    src="/before-pothole.jpg"
                    alt="Pothole Issue Before Repair"
                    className="w-full h-full object-cover"
                  />
                  {/* Before Badge */}
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-md shadow-xs">
                    Before
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono truncate hidden sm:block">
                    Pothole • Citizen Report
                  </div>
                </div>

                {/* Floating Center Arrow Button */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-[#EBE3D7] flex items-center justify-center text-[#A34B24]">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* After Photo */}
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] border-2 border-[#A34B24] shadow-2xs bg-slate-900">
                  <img 
                    src="/after-road.jpg"
                    alt="Fresh Asphalt Repaved Road"
                    className="w-full h-full object-cover"
                  />
                  {/* After Badge */}
                  <div className="absolute top-2 left-2 bg-[#A34B24] text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-md shadow-xs">
                    After
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-[#A34B24]/90 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center justify-between hidden sm:flex">
                    <span>Repaved Surface</span>
                    <span className="font-bold">SSIM: 94%</span>
                  </div>
                </div>

              </div>

              {/* Status bar under Before/After */}
              <div className="mt-4 pt-3 border-t border-[#EBE3D7] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">
                    YOLOv8 + SSIM Vision Model Verified
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 font-medium text-[10px] sm:text-[11px]">
                  <span>GPS: <strong>3.2m</strong> (&lt;9m rule)</span>
                  <span>AI: <strong className="text-emerald-700">APPROVE</strong></span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Vertical Capabilities List */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
              
              <div className="flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] lg:bg-transparent hover:bg-[#FAF7F2] transition-colors border border-[#EBE3D7] lg:border-transparent">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900">Image Analysis</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Detects issues with YOLOv8</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] lg:bg-transparent hover:bg-[#FAF7F2] transition-colors border border-[#EBE3D7] lg:border-transparent">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900">GPS Validation</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Confirms on-site location (&lt;9m)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] lg:bg-transparent hover:bg-[#FAF7F2] transition-colors border border-[#EBE3D7] lg:border-transparent">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900">Metadata Check</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Validates EXIF &amp; timestamp</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] lg:bg-transparent hover:bg-[#FAF7F2] transition-colors border border-[#EBE3D7] lg:border-transparent">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E6] text-[#A34B24] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900">Fraud Detection</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Guards against fake photos</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          05. LIVE GIS OPERATIONS MAP & DATABASE KPI COUNTERS
          ========================================================================= */}
      <section id="about" className="py-12 sm:py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Complaints</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.totalComplaints}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Live Database Records</div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Field Tasks</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#A34B24] mt-1">{stats.activeTasks}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Dispatched to Workers</div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved Issues</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">{stats.resolvedIssues}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cleaned &amp; Closed</div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EBE3D7] shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Verification</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">{stats.verificationRate}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Dual AI + GPS Audited</div>
          </div>

        </div>

        {/* Live GIS Map Card */}
        <div className="bg-white rounded-2xl border border-[#EBE3D7] overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-[#EBE3D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#A34B24]" />
                Live City Civic Operations Map
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Real-time incident distribution, worker locations, and hotspot intelligence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE7DC] border border-[#EBE3D7] text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Full GIS Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="w-full">
            <LeafletMap complaints={complaints} height="360px" />
          </div>
        </div>

      </section>


      {/* =========================================================================
          06. CONTACT & MUNICIPAL ACTION BANNER
          ========================================================================= */}
      <section id="contact" className="py-12 sm:py-14 px-4 md:px-8 bg-[#FAF0E6] border-t border-[#EBE3D7]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ready to Build a Cleaner, Smarter City?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed px-2">
            Join thousands of active citizens, municipal workers, and city administrators working together on CityConnectAI.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/citizen"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#A34B24] hover:bg-[#8C3E1B] text-white text-xs font-bold shadow-md shadow-[#A34B24]/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              <span>Report an Issue</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#EBE3D7] text-slate-800 text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5"
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
