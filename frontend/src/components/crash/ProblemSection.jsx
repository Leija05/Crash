import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const ProblemSection = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [ref1, isVisible1] = useInView({ threshold: 0.2 });
  const [ref2, isVisible2] = useInView({ threshold: 0.2 });

  return (
    <section id="problema" data-testid="problem-section" className="grid md:grid-cols-2 gap-16 items-center">
      <div 
        ref={ref1}
        className={`order-2 md:order-1 transition-all duration-700 ${
          isVisible1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
        }`}
      >
        <h2 className="text-4xl font-black text-foreground mb-8 leading-none tracking-tight">
          {t.problem.title} <br/>
          <span className="text-red-600 italic text-5xl gradient-text-animated">{t.problem.highlight}</span>
        </h2>
        
        <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
          <p className="animate-fade-in">{t.problem.description}</p>
          
          {/* Quote */}
          <div className={`border-l-4 border-red-500 p-6 rounded-r-2xl italic relative overflow-hidden group transition-all hover:scale-[1.02] cursor-default ${
            theme === 'dark' ? 'bg-red-500/10 text-red-100/90' : 'bg-red-500/5 text-red-900'
          }`}>
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-all group-hover:rotate-12">
              <ShieldAlert size={40} />
            </div>
            <div className="relative z-10">"{t.problem.quote}"</div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className={`p-6 rounded-2xl border transition-all hover:scale-105 cursor-pointer animate-scale-pop animate-delay-200 ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20' 
                : 'bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/20'
            }`}>
              <p className="text-4xl font-black text-foreground mb-2">20%</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                {t.problem.stat1Label}
              </p>
            </div>
            <div className={`p-6 rounded-2xl border transition-all hover:scale-105 cursor-pointer animate-scale-pop animate-delay-300 ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20' 
                : 'bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/20'
            }`}>
              <p className="text-4xl font-black text-foreground mb-2">~4s</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                {t.problem.stat2Label}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Impact Card */}
      <div 
        ref={ref2}
        className={`relative group order-1 md:order-2 transition-all duration-700 ${
          isVisible2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
        }`}
      >
        <div className={`absolute inset-0 rounded-[3rem] blur-3xl transition-all animate-pulse ${
          theme === 'dark' 
            ? 'bg-red-600/10 group-hover:bg-red-600/20' 
            : 'bg-red-600/5 group-hover:bg-red-600/10'
        }`} />
        <div className={`relative p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl border transition-all hover:scale-[1.02] ${
          theme === 'dark' 
            ? 'bg-card border-white/10 hover:border-white/20' 
            : 'bg-card border-black/10 hover:border-black/20'
        }`}>
          <AlertTriangle className="text-red-600 mb-6 animate-bounce" size={56} />
          <h4 className="text-2xl font-black text-foreground mb-6 italic uppercase tracking-tighter decoration-red-600 underline underline-offset-[12px]">
            {t.problem.impactTitle}
          </h4>
          <ul className="space-y-5">
            <li className="flex items-center gap-4 group/item transition-all hover:translate-x-2">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover/item:scale-150 transition-transform animate-pulse" /> 
              <p className="text-muted-foreground">
                <span className="text-foreground font-black uppercase text-xs tracking-widest mr-2">
                  {t.problem.social}
                </span>
                {t.problem.socialDesc}
              </p>
            </li>
            <li className="flex items-center gap-4 group/item transition-all hover:translate-x-2">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover/item:scale-150 transition-transform animate-pulse" style={{ animationDelay: '0.2s' }} /> 
              <p className="text-muted-foreground">
                <span className="text-foreground font-black uppercase text-xs tracking-widest mr-2">
                  {t.problem.labor}
                </span>
                {t.problem.laborDesc}
              </p>
            </li>
            <li className="flex items-center gap-4 group/item transition-all hover:translate-x-2">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover/item:scale-150 transition-transform animate-pulse" style={{ animationDelay: '0.4s' }} /> 
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
