import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  AlertTriangle, 
  Bluetooth, 
  Settings, 
  MapPin, 
  Phone, 
  Clock,
  Activity,
  Battery,
  Wifi
} from 'lucide-react';

const MobileMockup = ({ isAlertActive, onCancelAlert }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [countdown, setCountdown] = useState(10);
  const [showTimeline, setShowTimeline] = useState(false);

  // Generate dynamic telemetry data
  const [telemetryData, setTelemetryData] = useState(
    Array.from({ length: 12 }, () => Math.random() * 60 + 20)
  );

  // Update telemetry in real-time
  useEffect(() => {
    if (!isAlertActive) {
      const interval = setInterval(() => {
        setTelemetryData(prev => [
          ...prev.slice(1),
          Math.random() * 60 + 20
        ]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isAlertActive]);

  // Countdown timer during alert
  useEffect(() => {
    if (isAlertActive) {
      setCountdown(10);
      setShowTimeline(false);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowTimeline(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAlertActive]);

  // Emergency contacts mock data
  const emergencyContacts = [
    { name: language === 'es' ? 'Emergencias' : 'Emergency', number: '911', icon: '🚨' },
    { name: language === 'es' ? 'Contacto 1' : 'Contact 1', number: '+52 ***', icon: '👤' },
    { name: language === 'es' ? 'Contacto 2' : 'Contact 2', number: '+52 ***', icon: '👤' }
  ];

  return (
    <div 
      data-testid="mobile-mockup"
      className={`w-[280px] md:w-[320px] h-[580px] md:h-[640px] mx-auto rounded-[3.5rem] border-[14px] transition-all duration-700 relative overflow-hidden shadow-2xl ${
        isAlertActive 
          ? 'border-red-600 bg-red-950/20 shadow-[0_0_100px_rgba(239,68,68,0.4)] animate-alert-border' 
          : theme === 'dark'
            ? 'border-[#1a1a1c] bg-[#0c0c0e] shadow-[0_60px_120px_-20px_rgba(0,0,0,1)]'
            : 'border-gray-300 bg-gray-100 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)]'
      }`}
    >
      {/* Pulsing alert rings */}
      {isAlertActive && (
        <>
          <div className="absolute inset-0 border-4 border-red-500 rounded-[3.5rem] animate-ping opacity-20" />
          <div className="absolute inset-0 border-4 border-red-500 rounded-[3.5rem] animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      <div className="p-8 h-full flex flex-col items-center justify-between">
        {/* Notch */}
        <div className={`w-20 h-1.5 rounded-full mb-6 transition-all duration-300 ${
          theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
        }`} />
        
        {isAlertActive ? (
          // ========== ALERT STATE ==========
          <div className="text-center w-full animate-scale-pop">
            {/* Alert Icon */}
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-600/40 animate-pulse-glow relative">
              <AlertTriangle className="text-red-600" size={48} />
              <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping" />
            </div>
            
            {/* Impact Title */}
            <h5 className="text-white font-black text-3xl mb-2 tracking-tighter italic animate-heartbeat">
              {t.mobile.impact}
            </h5>
            <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
              {t.mobile.gateway}
            </p>
            
            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="mb-8 animate-scale-pop">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="#ef4444"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - countdown / 10)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-red-500">{countdown}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  {language === 'es' ? 'Segundos para cancelar' : 'Seconds to cancel'}
                </p>
              </div>
            )}
            
            {/* Emergency Timeline */}
            {showTimeline && (
              <div className="space-y-3 mb-8 animate-slide-in-bottom">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center animate-scale-pop">
                    <Clock size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-400">
                      {language === 'es' ? 'Detección confirmada' : 'Detection confirmed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center animate-scale-pop animate-delay-100">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-yellow-400 animate-pulse">
                      {t.mobile.transmitting}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center animate-scale-pop animate-delay-200">
                    <Phone size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-400 opacity-50">
                      {language === 'es' ? 'Notificando contactos...' : 'Notifying contacts...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cancel Button */}
            <button 
              onClick={onCancelAlert}
              data-testid="cancel-alert-btn"
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-95 shadow-xl hover:shadow-2xl"
            >
              {t.mobile.cancelAlert}
            </button>
            
            {/* Emergency Contacts */}
            {showTimeline && (
              <div className="mt-6 space-y-2 animate-slide-in-bottom animate-delay-300">
                <p className="text-[9px] uppercase font-black tracking-wider opacity-40 mb-3">
                  {language === 'es' ? 'Contactos alertados' : 'Alerted contacts'}
                </p>
                {emergencyContacts.map((contact, i) => (
                  <div 
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left ${
                      theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                    }`}
                  >
                    <span className="text-lg">{contact.icon}</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-foreground">{contact.name}</p>
                      <p className="text-[8px] text-muted-foreground">{contact.number}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ========== NORMAL STATE ==========
          <div className="w-full animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">
                  {t.mobile.systemLive}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi size={14} className="text-blue-500 animate-pulse" />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110 cursor-pointer ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-black/5 border-black/10 hover:border-black/20'
                }`}>
                  <Settings size={18} className="text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Linked Device */}
            <div className={`p-6 rounded-[2rem] border mb-6 shadow-inner transition-all hover:scale-[1.02] cursor-pointer ${
              theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-black/5 border-black/5 hover:border-black/10'
            }`}>
              <p className="text-[9px] uppercase font-black tracking-[0.4em] opacity-30 mb-3">
                {t.mobile.linkedDevice}
              </p>
              <p className="text-lg text-foreground font-black flex items-center gap-3">
                <Bluetooth size={20} className="text-blue-500 animate-pulse" /> 
                <span className="gradient-text-animated">CASCO_V2.0</span>
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-5 rounded-3xl border transition-all hover:scale-105 cursor-pointer ${
                theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-black/5 border-black/5 hover:border-black/10'
              }`}>
                <Activity size={16} className="text-red-500 mb-2" />
                <p className="text-[8px] uppercase font-black opacity-20 mb-2">{t.mobile.logs}</p>
                <p className="text-2xl font-black text-foreground italic">12</p>
              </div>
              <div className={`p-5 rounded-3xl border transition-all hover:scale-105 cursor-pointer ${
                theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-black/5 border-black/5 hover:border-black/10'
              }`}>
                <Battery size={16} className="text-green-500 mb-2" />
                <p className="text-[8px] uppercase font-black opacity-20 mb-2">{t.mobile.battery}</p>
                <p className="text-2xl font-black text-green-500 italic">94%</p>
              </div>
            </div>

            {/* Telemetry Chart */}
            <div>
              <p className={`text-[10px] uppercase font-black tracking-[0.4em] mb-4 ${
                theme === 'dark' ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {t.mobile.telemetry}
              </p>
              <div className={`h-40 rounded-[2rem] flex items-end p-6 border shadow-inner relative overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-gradient-to-t from-red-600/10 via-transparent to-transparent border-white/5' 
                  : 'bg-gradient-to-t from-red-600/5 via-transparent to-transparent border-black/5'
              }`}>
                {/* Animated grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {[0, 25, 50, 75, 100].map((y) => (
                    <div 
                      key={y} 
                      className={`absolute left-0 right-0 border-t ${
                        theme === 'dark' ? 'border-white/5' : 'border-black/5'
                      }`}
                      style={{ bottom: `${y}%` }}
                    />
                  ))}
                </div>
                
                {/* Bars */}
                <div className="w-full flex gap-1.5 items-end justify-between h-full relative z-10">
                  {telemetryData.map((h, i) => (
                    <div 
                      key={i} 
                      className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm hover:from-red-500 hover:to-red-300 transition-all duration-300 cursor-pointer relative group" 
                      style={{ 
                        height: `${h}%`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                        {h.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bottom Bar */}
        <div className="w-full pb-2">
          <div className={`h-1.5 rounded-full w-24 mx-auto transition-all ${
            theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
          }`} />
        </div>
      </div>
    </div>
  );
};

export default MobileMockup;
