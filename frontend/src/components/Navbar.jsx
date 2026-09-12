import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, LogOut, LayoutDashboard, Truck, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-border px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-emerald flex items-center justify-center text-white shadow-md shadow-brand-emerald/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-brand-text tracking-tight">CLEAN CITY</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-blue text-white tracking-widest uppercase">AI</span>
            </div>
            <span className="text-[11px] font-medium text-brand-muted hidden sm:block">Smart Civic Operations Platform</span>
          </div>
        </Link>

        {/* Center Role Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-brand-bg p-1.5 rounded-2xl border border-brand-border">
          <Link
            to="/citizen"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-text hover:bg-white hover:shadow-xs transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-brand-emerald" /> Citizen
          </Link>
          <Link
            to="/worker"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-text hover:bg-white hover:shadow-xs transition-all flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-brand-blue" /> Worker
          </Link>
          <Link
            to="/admin"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-text hover:bg-white hover:shadow-xs transition-all flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-600" /> Admin
          </Link>
        </nav>

        {/* Right User State */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-brand-text">{user.name}</div>
                <div className="text-[10px] font-semibold text-brand-emerald capitalize">{user.role} Account</div>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-2 rounded-xl text-brand-muted hover:text-brand-critical hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-emerald hover:bg-[#066749] shadow-sm transition-all"
              >
                Sign In / Access Roles
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
