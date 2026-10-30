import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const location = useLocation();

  if (location.pathname === '/worker' || location.pathname === '/citizen' || location.pathname === '/admin') {
    return null;
  }
  return (
    <footer className="bg-white border-t border-[#EBE3D7] pt-12 pb-8 px-4 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#A34B24] text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base text-slate-900">CityConnectAI</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Smart civic operations platform for cleaner, safer, and transparent municipal management.
          </p>
          <div className="text-[11px] text-[#A34B24] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> AI Verified • GPS Validated
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-bold text-xs text-brand-text uppercase tracking-wider mb-3">Roles & Portals</h4>
          <ul className="space-y-2 text-xs text-brand-muted">
            <li><Link to="/citizen" className="hover:text-brand-emerald transition-colors">Citizen Portal</Link></li>
            <li><Link to="/worker" className="hover:text-brand-emerald transition-colors">Worker Field Console</Link></li>
            <li><Link to="/admin" className="hover:text-brand-emerald transition-colors">Municipal Command Center</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="font-bold text-xs text-brand-text uppercase tracking-wider mb-3">AI Technologies</h4>
          <ul className="space-y-2 text-xs text-brand-muted">
            <li><span className="hover:text-brand-emerald">YOLOv8 Object Detection</span></li>
            <li><span className="hover:text-brand-emerald">SSIM Image Matcher</span></li>
            <li><span className="hover:text-brand-emerald">Haversine GPS Verification (&lt;9m)</span></li>
            <li><span className="hover:text-brand-emerald">AI Hotspot & Density Engine (&gt;5 Rule)</span></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="font-bold text-xs text-brand-text uppercase tracking-wider mb-3">Governance</h4>
          <ul className="space-y-2 text-xs text-brand-muted">
            <li><a href="#" className="hover:text-brand-emerald">Municipal Compliance</a></li>
            <li><a href="#" className="hover:text-brand-emerald">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-brand-emerald">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-brand-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-muted">
        <p>© 2026 CityConnectAI. All Rights Reserved.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0">
          Crafted for Smart City Operations
        </p>
      </div>
    </footer>
  );
}
