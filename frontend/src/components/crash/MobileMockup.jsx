import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertTriangle, Bluetooth, Settings } from 'lucide-react';

const MobileMockup = ({ isAlertActive, onCancelAlert }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Generate random bar heights for telemetry visualization
  const barHeights = [35, 55, 40, 75, 45, 60, 48, 42, 65, 50, 40, 30];

  return (
    <div 
      data-testid="mobile-mockup"
      className={`w-[280px] md:w-[320px] h-[580px] md:h-[640px] mx-auto rounded-[3.5rem] border-[14px] transition-all duration-700 relative overflow-hidden ${
        isAlertActive 
          ? 'border-red-600 bg-red-950/20 shadow-[0_0_100px_rgba(239,68,68,0.2)]' 
          : theme === 'dark'
            ? 'border-[#1a1a1c] bg-[#0c0c0e] shadow-[0_60px_120px_-20px_rgba(0,0,0,1)]'
            : 'border-gray-300 bg-gray-100 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)]'
      }`}
    >
      <div className="p-8 h-full flex flex-col items-center justify-between">
        {/* Notch */}
        <div className={`w-20 h-1.5 rounded-full mb-6 ${
          theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
        }`} />
        
        {isAlertActive ? (
          // Alert State
          <div className="text-center w-full animate-in zoom-in-90 duration-500">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-red-600/40 animate-pulse shadow-2xl shadow-red-600/20">
              <AlertTriangle className="text-red-600" size={48} />
            </div>
            <h5 className="text-white font-black text-3xl mb-3 tracking-tighter italic">
              {t.mobile.impact}
            </h5>
            <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.4em] mb-10">
              {t.mobile.gateway}
            </p>
            
            {/* Progress Bar */}
            <div className="space-y-4 mb-10">
              <div className={`h-2.5 rounded-full overflow-hidden border ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 animate-pulse" 
                  style={{ width: '75%' }}
                />
              </div>
              <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase italic">
                {t.mobile.transmitting}
              </p>
            </div>
            
            <button 
              onClick={onCancelAlert}
              data-testid="cancel-alert-btn"
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
            >
              {t.mobile.cancelAlert}
            </button>
          </div>
        ) : (
          // Normal State
          <div className="w-full animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">
                  {t.mobile.systemLive}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
              }`}>
                <Settings size={18} className="text-muted-foreground" />
              </div>
            </div>

            {/* Linked Device */}
            <div className={`p-6 rounded-[2rem] border mb-8 shadow-inner ${
              theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
            }`}>
              <p className="text-[9px] uppercase font-black tracking-[0.4em] opacity-30 mb-3">
                {t.mobile.linkedDevice}
              </p>
              <p className="text-lg text-foreground font-black flex items-center gap-3">
                <Bluetooth size={20} className="text-blue-500" /> CASCO_V2.0
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-5 rounded-3xl border ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
              }`}>
                <p className="text-[8px] uppercase font-black opacity-20 mb-2">{t.mobile.logs}</p>
                <p className="text-2xl font-black text-foreground italic">12</p>
              </div>
              <div className={`p-5 rounded-3xl border ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
              }`}>
                <p className="text-[8px] uppercase font-black opacity-20 mb-2">{t.mobile.battery}</p>
                <p className="text-2xl font-black text-green-500 italic">94%</p>
              </div>
            </div>

            {/* Telemetry Chart */}
            <div className="mt-12">
              <p className={`text-[10px] uppercase font-black tracking-[0.4em] mb-6 ${
                theme === 'dark' ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {t.mobile.telemetry}
              </p>
              <div className={`h-40 rounded-[2rem] flex items-end p-6 border shadow-inner ${
                theme === 'dark' 
                  ? 'bg-gradient-to-t from-red-600/10 via-transparent to-transparent border-white/5' 
                  : 'bg-gradient-to-t from-red-600/5 via-transparent to-transparent border-black/5'
              }`}>
                <div className="w-full flex gap-1.5 items-end justify-between h-full">
                  {barHeights.map((h, i) => (
                    <div 
                      key={i} 
                      className="w-full bg-red-600/20 rounded-t-sm hover:bg-red-600 transition-colors cursor-pointer" 
                      style={{ height: `${h}%` }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bottom Bar */}
        <div className="w-full pb-2">
          <div className={`h-1.5 rounded-full w-24 mx-auto ${
            theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
          }`} />
        </div>
      </div>
    </div>
  );
};

export default MobileMockup;
