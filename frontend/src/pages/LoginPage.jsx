import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Truck, ShieldCheck, ArrowRight, AlertCircle, HardHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CityConnectLogo from '../components/CityConnectLogo';

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
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-2xl border border-[#EBE3D7] shadow-xl w-full max-w-md p-6 sm:p-8"
      >
        <Link to="/" className="flex items-center justify-center gap-3 mb-6 group">
          <CityConnectLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
          <div className="text-left">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
              CityConnectAI
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">
              Smart Civic Operations Platform
            </span>
          </div>
        </Link>

        <h2 className="text-xl font-bold text-center text-slate-900 mb-1">
          {isRegister ? 'Create Platform Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-center text-slate-500 mb-6">
          Access your personalized civic operations workspace
        </p>

        {/* Quick Demo Access Bar */}
        <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EBE3D7] mb-6">
          <div className="text-[10px] font-bold text-slate-400 uppercase text-center mb-2">Instant Demo Role Access:</div>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              onClick={() => handleQuickDemo('citizen')} 
              className="p-2 bg-[#FAF0E6] text-[#A34B24] rounded-xl text-[11px] font-bold border border-[#F4D7C5] hover:bg-[#F5E6D8] flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" /> Citizen
            </button>
            <button 
              type="button"
              onClick={() => handleQuickDemo('worker')} 
              className="p-2 bg-blue-50 text-blue-700 rounded-xl text-[11px] font-bold border border-blue-200 hover:bg-blue-100 flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <HardHat className="w-4 h-4" /> Worker
            </button>
            <button 
              type="button"
              onClick={() => handleQuickDemo('admin')} 
              className="p-2 bg-purple-50 text-purple-700 rounded-xl text-[11px] font-bold border border-purple-200 hover:bg-purple-100 flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
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
              <label className="font-semibold text-slate-700 block mb-1">Full Name:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Rahul Verma" 
                className="w-full p-3 border border-[#EBE3D7] rounded-xl outline-none focus:border-[#A34B24]"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@citycorp.gov.in" 
              className="w-full p-3 border border-[#EBE3D7] rounded-xl outline-none focus:border-[#A34B24]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full p-3 border border-[#EBE3D7] rounded-xl outline-none focus:border-[#A34B24]"
            />
          </div>

          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Account Role:</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="w-full p-3 border border-[#EBE3D7] rounded-xl outline-none"
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
            className="w-full py-3 bg-[#A34B24] text-white font-bold rounded-xl hover:bg-[#8C3E1B] shadow-md shadow-[#A34B24]/20 transition-all mt-2 cursor-pointer"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-[#A34B24] font-bold hover:underline cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
