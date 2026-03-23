import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ShieldAlert } from 'lucide-react';
import CrashLogo from './CrashLogo';
import { useInView } from '@/hooks/useInView';

const HeroSection = ({ gForce, isAlertActive }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [heroRef, isHeroVisible] = useInView({ threshold: 0.35, once: false });
  const [logoAnimationKey, setLogoAnimationKey] = useState(0);

  useEffect(() => {
    if (isHeroVisible) {
      setLogoAnimationKey((currentKey) => currentKey + 1);
    }
  }, [isHeroVisible]);

  return (
    <header ref={heroRef} data-testid="hero-section" className="relative pt-32 pb-20 overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[128px] animate-float ${
          theme === 'dark' ? 'bg-red-600/20' : 'bg-red-600/10'
        }`} />
        <div className={`absolute top-40 right-1/4 w-64 h-64 rounded-full blur-[128px] animate-float animate-delay-300 ${
          theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-600/5'
        }`} />
        {/* Additional particles */}
        <div className={`particle w-2 h-2 top-1/4 left-1/3 animate-delay-200 ${
          theme === 'dark' ? 'bg-red-500/30' : 'bg-red-500/20'
        }`} style={{ animationDuration: '15s' }} />
        <div className={`particle w-3 h-3 top-1/3 right-1/4 animate-delay-500 ${
          theme === 'dark' ? 'bg-red-500/20' : 'bg-red-500/10'
        }`} style={{ animationDuration: '20s' }} />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-10 animate-scale-pop">
          <div className="relative">
            {/* Glow effect background */}
            <div className={`absolute inset-0 blur-2xl ${
              isAlertActive ? 'bg-red-600/40 animate-pulse' : 'bg-red-600/20'
            }`} />
            {isHeroVisible && (
              <CrashLogo
                key={logoAnimationKey}
                width={isAlertActive ? 208 : 192}
                height={isAlertActive ? 208 : 192}
                color="#ef4444"
                shouldAnimate
                className={`relative filter transition-all duration-700 ${
                  isAlertActive
                    ? 'drop-shadow-[0_0_30px_rgba(239,68,68,1)] animate-heartbeat'
                    : 'drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]'
                }`}
              />
            )}
          </div>
        </div>
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold mb-6 animate-pulse tracking-[0.1em]">
          <ShieldAlert size={14} className="animate-heartbeat" /> {t.hero.badge}
        </div>
        
        {/* Main Title */}
        <h1 
          data-testid="hero-title"
          className="text-6xl md:text-9xl font-black text-foreground mb-6 tracking-tighter italic leading-none animate-slide-in-bottom"
        >
          {t.hero.title}
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-tight font-medium animate-slide-in-bottom animate-delay-200">
          {t.hero.subtitle}
          <span className="block mt-4 text-red-500 font-bold italic text-lg uppercase tracking-[0.3em] animate-pulse">
            {t.hero.tagline}
          </span>
        </p>
        
        {/* G-Force Display */}
        <div className="flex flex-col items-center gap-4 animate-slide-in-bottom animate-delay-300">
          <div 
            data-testid="gforce-display"
            className={`p-10 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden ${
              isAlertActive 
                ? 'bg-red-600/20 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.4)] scale-110 animate-alert-border' 
                : theme === 'dark' 
                  ? 'bg-white/5 border-white/10 hover:border-white/20' 
                  : 'bg-black/5 border-black/10 hover:border-black/20'
            }`}
          >
            {/* Animated shimmer effect */}
            {!isAlertActive && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
            )}
            
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3 opacity-60 font-bold text-muted-foreground relative z-10">
              {t.hero.telemetry}
            </p>
            <p 
              data-testid="gforce-value"
              className={`text-7xl font-mono font-black transition-all duration-300 relative z-10 ${
                isAlertActive ? 'text-red-500 animate-heartbeat' : 'text-foreground'
              }`}
            >
              {gForce.toFixed(2)}
              <span className="text-3xl opacity-50 ml-1 italic">G</span>
            </p>
            
            {/* Alert waves */}
            {isAlertActive && (
              <>
                <div className="absolute inset-0 border-2 border-red-500 rounded-[2.5rem] animate-ping opacity-20" />
                <div className="absolute inset-0 border-2 border-red-500 rounded-[2.5rem] animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
