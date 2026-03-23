import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useInView } from '@/hooks/useInView';
import CrashLogo from './CrashLogo';
import axios from 'axios';
import { FileText, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Footer = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [ref, isVisible] = useInView({ threshold: 0.1 });
  
  // Report generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState(null); // 'success', 'error', null

  const generateReport = async () => {
    setIsGenerating(true);
    setReportStatus(null);

    try {
      // Call backend to generate report
      const response = await axios.post(`${API}/generate-report`, {
        language: language
      });

      const { content, generated_with_ai } = response.data;

      const footerText = generated_with_ai
        ? (language === 'es' ? '\n\n✨ Reporte mejorado con IA Gemini' : '\n\n✨ Report enhanced with Gemini AI')
        : (language === 'es' ? '\n\nReporte generado automáticamente' : '\n\nAutomatically generated report');

      const blob = new Blob([`${content}${footerText}`], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = language === 'es'
        ? 'CRASH_Reporte_Completo.md'
        : 'CRASH_Complete_Report.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setReportStatus('success');
      setTimeout(() => setReportStatus(null), 3000);

    } catch (error) {
      console.error('Error generating report:', error);
      setReportStatus('error');
      setTimeout(() => setReportStatus(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

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
          <div className="relative">
            {/* Glow background */}
            <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full animate-pulse" />
            <CrashLogo 
              width={80}
              height={80}
              color="#ef4444"
              className="relative filter drop-shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-float hover:drop-shadow-[0_0_25px_rgba(239,68,68,1)] transition-all duration-300"
            />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-4xl font-black text-foreground uppercase tracking-tighter">
              C.R.A.S.H.
            </span>
            <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest mt-1">
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

        {/* Generate Report Button */}
        <div className="mb-16">
          <button
            data-testid="generate-report-btn"
            onClick={generateReport}
            disabled={isGenerating}
            className={`group relative px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50'
            }`}
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400 to-red-600 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            
            {/* Button content */}
            <div className="relative flex items-center gap-3">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.footer.generating}</span>
                </>
              ) : reportStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t.footer.reportReady}</span>
                </>
              ) : reportStatus === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>{t.footer.reportError}</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>{t.footer.generateReport}</span>
                  <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </div>
          </button>

          {/* Status message */}
          {reportStatus && (
            <p className={`mt-3 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              reportStatus === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {reportStatus === 'success' ? '✓ ' : '✗ '}
              {reportStatus === 'success' ? t.footer.reportReady : t.footer.reportError}
            </p>
          )}
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
