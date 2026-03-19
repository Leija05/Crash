import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ShieldAlert } from 'lucide-react';

const HeroSection = ({ gForce, isAlertActive }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <header data-testid="hero-section" className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[128px] ${
          theme === 'dark' ? 'bg-red-600/20' : 'bg-red-600/10'
        }`} />
        <div className={`absolute top-40 right-1/4 w-64 h-64 rounded-full blur-[128px] ${
          theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-600/5'
        }`} />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold mb-6 animate-pulse tracking-[0.1em]">
          <ShieldAlert size={14} /> {t.hero.badge}
        </div>
        
        {/* Main Title */}
        <h1 
          data-testid="hero-title"
          className="text-6xl md:text-9xl font-black text-foreground mb-6 tracking-tighter italic leading-none"
        >
          {t.hero.title}
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-tight">
          {t.hero.subtitle}
          <span className="block mt-4 text-red-500 font-bold italic text-lg uppercase tracking-[0.3em]">
            {t.hero.tagline}
          </span>
        </p>
        
        {/* G-Force Display */}
        <div className="flex flex-col items-center gap-4">
          <div 
            data-testid="gforce-display"
            className={`p-10 rounded-[2.5rem] border transition-all duration-500 ${
              isAlertActive 
                ? 'bg-red-600/20 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.4)] scale-110' 
                : theme === 'dark' 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-black/5 border-black/10'
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3 opacity-60 font-bold text-muted-foreground">
              {t.hero.telemetry}
            </p>
            <p 
              data-testid="gforce-value"
              className={`text-7xl font-mono font-black transition-colors ${
                isAlertActive ? 'text-red-500' : 'text-foreground'
              }`}
            >
              {gForce.toFixed(2)}
              <span className="text-3xl opacity-50 ml-1 italic">G</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
