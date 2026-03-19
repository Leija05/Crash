import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useInView } from '@/hooks/useInView';

const Footer = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [ref, isVisible] = useInView({ threshold: 0.1 });

  useEffect(() => {
    const img = new Image();
    img.src = `${process.env.PUBLIC_URL}/crash-logo.png`;
    img.onload = () => setLogoLoaded(true);
  }, []);

  return (
    <footer 
      data-testid="footer"
      className={`border-t py-32 relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-black border-white/5' 
          : 'bg-gray-50 border-black/5'
      }`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse ${
          theme === 'dark' ? 'bg-red-600/5' : 'bg-red-600/3'
        }`} />
      </div>
      
      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50 animate-gradient-shift" />
      
      <div 
        ref={ref}
        className={`container mx-auto px-6 text-center relative z-10 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {logoLoaded ? (
            <img 
              src={`${process.env.PUBLIC_URL}/crash-logo.png`}
              alt="C.R.A.S.H. Logo" 
              className="w-16 h-16 object-contain logo-glow animate-float"
            />
          ) : (
            <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center font-black text-white italic text-2xl shadow-xl shadow-red-600/30">
              C
            </div>
          )}
          <div className="flex flex-col items-start">
            <span className="text-3xl font-black text-foreground uppercase tracking-tighter">
              C.R.A.S.H.
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Response & Monitoring Systems
            </span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed font-bold tracking-tight mb-8">
          {t.footer.description} <br/>
          {t.footer.subtitle}
        </p>
        
        {/* Tech Stack Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {['React', 'FastAPI', 'MongoDB', 'Gemini AI', 'Arduino', 'MPU-6050'].map((tech, i) => (
            <span 
              key={tech}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-110 cursor-default animate-fade-in ${
                theme === 'dark' 
                  ? 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10' 
                  : 'bg-black/5 border border-black/10 text-muted-foreground hover:bg-black/10'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {tech}
            </span>
          ))}
        </div>
        
        {/* Footer Links */}
        <div className={`mt-16 flex flex-col md:flex-row justify-center gap-12 border-t pt-16 ${
          theme === 'dark' ? 'border-white/5' : 'border-black/5'
        }`}>
          <div className="text-center md:text-left group cursor-default transition-all hover:scale-105">
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-20 block mb-3 group-hover:opacity-100 transition-opacity">
              {t.footer.devLab}
            </span>
            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
              {t.footer.devLabDesc}
            </span>
          </div>
          <div className="text-center md:text-left group cursor-default transition-all hover:scale-105">
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-20 block mb-3 group-hover:opacity-100 transition-opacity">
              {t.footer.event}
            </span>
            <span className="text-xs font-bold text-red-600 group-hover:text-red-500 transition-colors italic">
              {t.footer.eventName}
            </span>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-8 border-t ${
          theme === 'dark' ? 'border-white/5' : 'border-black/5'
        }">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            © 2026 C.R.A.S.H. | All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
