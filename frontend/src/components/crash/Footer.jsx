import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

const Footer = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <footer 
      data-testid="footer"
      className={`border-t py-32 relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-black border-white/5' 
          : 'bg-gray-50 border-black/5'
      }`}
    >
      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-transparent to-red-600 opacity-30" />
      
      <div className="container mx-auto px-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center font-black text-white italic text-2xl shadow-xl shadow-red-600/30">
            C
          </div>
          <span className="text-3xl font-black text-foreground uppercase tracking-tighter">
            C.R.A.S.H.
          </span>
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed font-bold tracking-tight">
          {t.footer.description} <br/>
          {t.footer.subtitle}
        </p>
        
        {/* Footer Links */}
        <div className={`mt-16 flex justify-center gap-12 border-t pt-16 ${
          theme === 'dark' ? 'border-white/5' : 'border-black/5'
        }`}>
          <div className="text-left group cursor-default">
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-20 block mb-3 group-hover:opacity-100 transition-opacity">
              {t.footer.devLab}
            </span>
            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
              {t.footer.devLabDesc}
            </span>
          </div>
          <div className="text-left group cursor-default">
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-20 block mb-3 group-hover:opacity-100 transition-opacity">
              {t.footer.event}
            </span>
            <span className="text-xs font-bold text-red-600 group-hover:text-red-500 transition-colors italic">
              {t.footer.eventName}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
