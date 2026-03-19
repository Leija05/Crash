import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

const ProblemSection = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <section id="problema" data-testid="problem-section" className="grid md:grid-cols-2 gap-16 items-center">
      <div className="order-2 md:order-1">
        <h2 className="text-4xl font-black text-foreground mb-8 leading-none tracking-tight">
          {t.problem.title} <br/>
          <span className="text-red-600 italic text-5xl">{t.problem.highlight}</span>
        </h2>
        
        <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
          <p>{t.problem.description}</p>
          
          {/* Quote */}
          <div className={`border-l-4 border-red-500 p-6 rounded-r-2xl italic relative overflow-hidden group ${
            theme === 'dark' ? 'bg-red-500/10 text-red-100/90' : 'bg-red-500/5 text-red-900'
          }`}>
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <ShieldAlert size={40} />
            </div>
            "{t.problem.quote}"
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className={`p-6 rounded-2xl border transition-colors ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/5 hover:bg-white/10' 
                : 'bg-black/5 border-black/5 hover:bg-black/10'
            }`}>
              <p className="text-4xl font-black text-foreground">20%</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                {t.problem.stat1Label}
              </p>
            </div>
            <div className={`p-6 rounded-2xl border transition-colors ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/5 hover:bg-white/10' 
                : 'bg-black/5 border-black/5 hover:bg-black/10'
            }`}>
              <p className="text-4xl font-black text-foreground">~4s</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                {t.problem.stat2Label}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Impact Card */}
      <div className="relative group order-1 md:order-2">
        <div className={`absolute inset-0 rounded-[3rem] blur-3xl transition-all ${
          theme === 'dark' 
            ? 'bg-red-600/10 group-hover:bg-red-600/20' 
            : 'bg-red-600/5 group-hover:bg-red-600/10'
        }`} />
        <div className={`relative p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl border ${
          theme === 'dark' 
            ? 'bg-card border-white/10' 
            : 'bg-card border-black/10'
        }`}>
          <AlertTriangle className="text-red-600 mb-6 animate-bounce" size={56} />
          <h4 className="text-2xl font-black text-foreground mb-6 italic uppercase tracking-tighter decoration-red-600 underline underline-offset-[12px]">
            {t.problem.impactTitle}
          </h4>
          <ul className="space-y-5">
            <li className="flex items-center gap-4 group">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover:scale-150 transition-transform" /> 
              <p className="text-muted-foreground">
                <span className="text-foreground font-black uppercase text-xs tracking-widest mr-2">
                  {t.problem.social}
                </span>
                {t.problem.socialDesc}
              </p>
            </li>
            <li className="flex items-center gap-4 group">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover:scale-150 transition-transform" /> 
              <p className="text-muted-foreground">
                <span className="text-foreground font-black uppercase text-xs tracking-widest mr-2">
                  {t.problem.labor}
                </span>
                {t.problem.laborDesc}
              </p>
            </li>
            <li className="flex items-center gap-4 group">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover:scale-150 transition-transform" /> 
              <p className="text-muted-foreground">
                <span className="text-foreground font-black uppercase text-xs tracking-widest mr-2">
                  {t.problem.education}
                </span>
                {t.problem.educationDesc}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
