import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, Truck, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');

  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name || !email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      const res = await register(name, email, password, role);
      if (res.success) {
        navigate(res.user.role === 'admin' ? '/admin' : res.user.role === 'worker' ? '/worker' : '/citizen');
      } else {
        setError(res.message);
      }
    } else {
      if (!email || !password) {
        setError('Please enter email and password.');
        return;
      }
      const res = await login(email, password);
      if (res.success) {
        navigate(res.user.role === 'admin' ? '/admin' : res.user.role === 'worker' ? '/worker' : '/citizen');
      } else {
        setError(res.message);
      }
    }
  };

  // Quick Demo Logins for judges / reviewers
  const handleQuickDemo = async (demoRole) => {
    let demoEmail = '';
    let demoName = '';
    if (demoRole === 'citizen') {
      demoEmail = 'citizen.demo@cleancity.ai';
      demoName = 'Aarav Sharma';
    } else if (demoRole === 'worker') {
      demoEmail = 'worker.demo@cleancity.ai';
      demoName = 'Vikram Singh';
    } else if (demoRole === 'admin') {
      demoEmail = 'admin.demo@cleancity.ai';
      demoName = 'Municipal Director';
    }

    const regRes = await register(demoName, demoEmail, 'demo12345', demoRole);
    if (!regRes.success) {
      await login(demoEmail, 'demo12345');
    }
    navigate(demoRole === 'admin' ? '/admin' : demoRole === 'worker' ? '/worker' : '/citizen');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-card border border-brand-border shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-emerald text-white flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-brand-text">CLEAN CITY AI</span>
        </div>

        <h2 className="text-xl font-bold text-center text-brand-text mb-1">
          {isRegister ? 'Create Platform Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-center text-brand-muted mb-6">
          Smart Civic Operations Platform Authentication
        </p>

        {/* Quick Demo Access Bar */}
        <div className="p-3 bg-brand-bg rounded-2xl border border-brand-border mb-6">
          <div className="text-[10px] font-bold text-brand-muted uppercase text-center mb-2">Instant Demo Role Access:</div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleQuickDemo('citizen')} className="p-2 bg-emerald-50 text-brand-emerald rounded-xl text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100 flex flex-col items-center gap-1">
              <User className="w-4 h-4" /> Citizen
            </button>
            <button onClick={() => handleQuickDemo('worker')} className="p-2 bg-blue-50 text-brand-blue rounded-xl text-[11px] font-bold border border-blue-200 hover:bg-blue-100 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4" /> Worker
            </button>
            <button onClick={() => handleQuickDemo('admin')} className="p-2 bg-purple-50 text-purple-600 rounded-xl text-[11px] font-bold border border-purple-200 hover:bg-purple-100 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="font-semibold text-brand-muted block mb-1">Full Name:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Rahul Verma" 
                className="w-full p-3 border border-brand-border rounded-xl outline-none focus:border-brand-emerald"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-brand-muted block mb-1">Email Address:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@citycorp.gov.in" 
              className="w-full p-3 border border-brand-border rounded-xl outline-none focus:border-brand-emerald"
            />
          </div>

          <div>
            <label className="font-semibold text-brand-muted block mb-1">Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full p-3 border border-brand-border rounded-xl outline-none focus:border-brand-emerald"
            />
          </div>

          {isRegister && (
            <div>
              <label className="font-semibold text-brand-muted block mb-1">Account Role:</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="w-full p-3 border border-brand-border rounded-xl outline-none"
              >
                <option value="citizen">Citizen (Report & Track)</option>
                <option value="worker">Worker (Field Operations & Proof)</option>
                <option value="admin">Admin (Municipal Control)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-brand-emerald text-white font-bold rounded-xl hover:bg-[#066749] shadow-md transition-colors mt-2"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-brand-emerald font-bold hover:underline"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
