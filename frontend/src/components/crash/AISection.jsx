import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Loader2 } from 'lucide-react';
import MobileMockup from './MobileMockup';

const AISection = ({ 
  isAlertActive, 
  isAnalyzing, 
  aiAnalysis, 
  onAnalyze,
  onCancelAlert 
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <section data-testid="ai-section" className="flex flex-col md:flex-row items-center gap-20">
      <div className="flex-1 order-2 md:order-1">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black mb-6 uppercase tracking-[0.2em] shadow-lg shadow-blue-500/10">
          <Sparkles size={14} className="animate-pulse" /> {t.ai.badge}
        </div>
        
        {/* Title */}
        <h2 className="text-5xl font-black text-foreground mb-8 tracking-tight italic leading-[1.05]">
          {t.ai.title} <span className="text-red-600 underline decoration-red-600/30 underline-offset-8">{t.ai.highlight}</span>
        </h2>
        
        {/* Description */}
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-medium">
          {t.ai.description}
        </p>
        
        {/* Analyze Button - Only show when alert is active */}
        {isAlertActive && (
          <button 
            onClick={onAnalyze}
            disabled={isAnalyzing}
            data-testid="analyze-ai-btn"
            className="w-full mb-8 p-5 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl font-black text-white flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            <span className="tracking-widest uppercase text-xs">
              {isAnalyzing ? t.ai.analyzing : t.ai.analyzeBtn}
            </span>
          </button>
        )}

        {/* AI Analysis Results */}
        {aiAnalysis && (
          <div 
            data-testid="ai-analysis-result"
            className={`border p-8 rounded-[2rem] animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-2xl relative overflow-hidden group ${
              theme === 'dark' 
                ? 'bg-[#11111a] border-blue-500/30' 
                : 'bg-blue-50 border-blue-300'
            }`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-2xl rounded-full ${
              theme === 'dark' ? 'bg-blue-600/5' : 'bg-blue-600/10'
            }`} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {t.ai.analysisTitle}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  aiAnalysis.severity === 'Alta' || aiAnalysis.severity === 'High' || aiAnalysis.severity === 'Crítica' || aiAnalysis.severity === 'Critical'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-yellow-500 text-black'
                }`}>
                  {t.ai.risk}: {aiAnalysis.severity}
                </span>
              </div>
              
              <div className="space-y-6">
                {/* Injuries */}
                <div>
                  <div className="text-foreground text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block" /> {t.ai.injuries}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.probable_injuries.map((injury, i) => (
                      <span 
                        key={i} 
                        className={`text-[10px] border px-3 py-1.5 rounded-full font-medium ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 text-gray-300' 
                            : 'bg-black/5 border-black/10 text-gray-700'
                        }`}
                      >
                        {injury}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className={`w-full h-px ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
                
                {/* First Aid */}
                <div>
                  <div className="text-foreground text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block" /> {t.ai.firstAid}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-3 font-medium">
                    {aiAnalysis.first_aid_steps.map((step, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="text-blue-500 font-black italic text-sm">{i + 1}.</span> 
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Mockup */}
      <div className="flex-1 order-1 md:order-2">
        <MobileMockup 
          isAlertActive={isAlertActive} 
          onCancelAlert={onCancelAlert}
        />
      </div>
    </section>
  );
};

export default AISection;
