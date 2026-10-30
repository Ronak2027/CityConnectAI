import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';
import CityConnectLogo from './CityConnectLogo';

export default function Footer() {
  const location = useLocation();

  if (location.pathname === '/worker' || location.pathname === '/citizen' || location.pathname === '/admin') {
    return null;
  }
  return (
    <footer className="bg-white border-t border-[#EBE3D7] pt-12 pb-8 px-4 lg:px-8 mt-16 sm:mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <CityConnectLogo className="w-8 h-8" />
            <span className="font-extrabold text-base text-slate-900">CityConnectAI</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Smart civic operations platform for cleaner, safer, and transparent municipal management.
          </p>
          <div className="text-[11px] text-[#A34B24] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> AI Verified • GPS Validated
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Roles &amp; Portals</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li><Link to="/citizen" className="hover:text-[#A34B24] transition-colors">Citizen Portal</Link></li>
            <li><Link to="/worker" className="hover:text-[#A34B24] transition-colors">Worker Field Console</Link></li>
            <li><Link to="/admin" className="hover:text-[#A34B24] transition-colors">Municipal Command Center</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">AI Technologies</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li><span>YOLOv8 Object Detection</span></li>
            <li><span>SSIM Image Matcher</span></li>
            <li><span>Haversine GPS Verification (&lt;9m)</span></li>
            <li><span>AI Hotspot &amp; Density Engine</span></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Governance</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li><a href="#" className="hover:text-[#A34B24]">Municipal Compliance</a></li>
            <li><a href="#" className="hover:text-[#A34B24]">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#A34B24]">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#EBE3D7] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 CityConnectAI. All Rights Reserved.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0">
          Crafted for Smart City Operations
        </p>
      </div>
    </footer>
  );
}
