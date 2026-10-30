import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, User, LogOut, LayoutDashboard, Truck, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/worker' || location.pathname === '/citizen' || location.pathname === '/admin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EBE3D7] px-4 lg:px-8 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#A34B24] flex items-center justify-center text-white shadow-md shadow-[#A34B24]/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">CityConnectAI</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 hidden sm:block">Smart Civic Operations Platform</span>
          </div>
        </Link>

        {/* Center Mockup Navigation Links */}
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

        {/* Right User State / Login Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] font-semibold text-[#A34B24] capitalize">{user.role} Account</div>
              </div>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker' : '/citizen'}
                className="px-3.5 py-1.5 rounded-xl bg-[#A34B24] text-white text-xs font-bold hover:bg-[#8C3E1B] transition-colors shadow-2xs"
              >
                Go to Portal
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#A34B24] hover:bg-[#8C3E1B] shadow-sm shadow-[#A34B24]/20 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
