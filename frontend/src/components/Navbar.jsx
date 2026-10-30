import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, User, LogOut, LayoutDashboard, Truck, ShieldAlert, Sparkles, Building2, Menu, X, ArrowRight, HardHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CityConnectLogo from './CityConnectLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (location.pathname === '/worker' || location.pathname === '/citizen' || location.pathname === '/admin') {
    return null;
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EBE3D7] px-4 lg:px-8 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo with Official CityConnectAI Shield Emblem */}
        <Link to="/" onClick={handleNavClick} className="flex items-center gap-2.5 sm:gap-3 group">
          <CityConnectLogo className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
              CityConnectAI
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
              Smart Civic Operations Platform
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
          <a
            href="#home"
            className="text-[#A34B24] relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#A34B24]"
          >
            Home
          </a>
          <a
            href="#about"
            className="hover:text-[#A34B24] transition-colors py-1"
          >
            About
          </a>
          <a
            href="#features"
            className="hover:text-[#A34B24] transition-colors py-1"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#A34B24] transition-colors py-1"
          >
            How It Works
          </a>
          <a
            href="#contact"
            className="hover:text-[#A34B24] transition-colors py-1"
          >
            Contact
          </a>
        </nav>

        {/* Right User State / Login & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] font-semibold text-[#A34B24] capitalize">{user.role} Account</div>
              </div>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker' : '/citizen'}
                className="px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl bg-[#A34B24] text-white text-xs font-bold hover:bg-[#8C3E1B] transition-colors shadow-2xs"
              >
                Go to Portal
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold text-white bg-[#A34B24] hover:bg-[#8C3E1B] shadow-sm shadow-[#A34B24]/20 transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 -mr-1 text-slate-800 hover:text-[#A34B24] hover:bg-slate-100/70 rounded-lg transition-colors md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#EBE3D7] space-y-3 pb-2 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-slate-700 px-1">
            <a
              href="#home"
              onClick={handleNavClick}
              className="px-3 py-2 rounded-lg bg-[#FAF7F2] text-[#A34B24] font-bold flex items-center justify-between"
            >
              <span>Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="#about"
              onClick={handleNavClick}
              className="px-3 py-2 rounded-lg hover:bg-[#FAF7F2] hover:text-[#A34B24] transition-colors"
            >
              About City Operations
            </a>
            <a
              href="#features"
              onClick={handleNavClick}
              className="px-3 py-2 rounded-lg hover:bg-[#FAF7F2] hover:text-[#A34B24] transition-colors"
            >
              Stakeholder Portals
            </a>
            <a
              href="#how-it-works"
              onClick={handleNavClick}
              className="px-3 py-2 rounded-lg hover:bg-[#FAF7F2] hover:text-[#A34B24] transition-colors"
            >
              AI Verification Pipeline
            </a>
            <a
              href="#contact"
              onClick={handleNavClick}
              className="px-3 py-2 rounded-lg hover:bg-[#FAF7F2] hover:text-[#A34B24] transition-colors"
            >
              Contact &amp; Governance
            </a>
          </nav>

          <div className="pt-2 border-t border-[#EBE3D7] px-1 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
              Quick Portals
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
              <Link
                to="/citizen"
                onClick={handleNavClick}
                className="p-2 rounded-xl bg-orange-50/60 border border-orange-100 text-[#A34B24] flex flex-col items-center gap-1"
              >
                <User className="w-4 h-4" />
                <span>Citizen</span>
              </Link>
              <Link
                to="/worker"
                onClick={handleNavClick}
                className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-700 flex flex-col items-center gap-1"
              >
                <HardHat className="w-4 h-4" />
                <span>Worker</span>
              </Link>
              <Link
                to="/admin"
                onClick={handleNavClick}
                className="p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-purple-700 flex flex-col items-center gap-1"
              >
                <Building2 className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
