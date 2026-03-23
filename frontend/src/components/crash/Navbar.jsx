import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Globe } from 'lucide-react';
import CrashLogo from './CrashLogo';

const Navbar = ({ scrolled, onSimulate }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <nav 
      data-testid="navbar"
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-md py-3 shadow-xl border-b border-border' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className={`relative transition-all duration-300 ${
            scrolled ? 'w-12 h-12' : 'w-14 h-14'
          }`}>
            <CrashLogo 
              width={scrolled ? 48 : 56}
              height={scrolled ? 48 : 56}
              color="#ef4444"
              className="w-full h-full filter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]"
            />
          </div>
          <div className="flex flex-col">
            <span className={`font-black tracking-tighter text-foreground transition-all duration-300 ${
              scrolled ? 'text-xl' : 'text-2xl'
            }`}>
              C.R.A.S.H.
            </span>
            <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">
              Response System
            </span>
          </div>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
            <a 
              href="#problema" 
              data-testid="nav-problem"
              className="text-muted-foreground hover:text-red-500 transition-all duration-300 hover:scale-110 relative group"
            >
              {t.nav.problem}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#arquitectura" 
              data-testid="nav-architecture"
              className="text-muted-foreground hover:text-red-500 transition-all duration-300 hover:scale-110 relative group"
            >
              {t.nav.architecture}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#hardware" 
              data-testid="nav-hardware"
              className="text-muted-foreground hover:text-red-500 transition-all duration-300 hover:scale-110 relative group"
            >
              {t.nav.hardware}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="p-2 rounded-full hover:bg-muted transition-all duration-300 hover:scale-110 hover:rotate-12"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-yellow-500 animate-rotate-pulse" />
            ) : (
              <Moon size={18} className="text-slate-700" />
            )}
          </button>
          
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            data-testid="language-toggle"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-muted transition-all duration-300 hover:scale-105 text-[10px] font-bold uppercase tracking-widest"
          >
            <Globe size={14} className="animate-pulse" />
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          
          {/* Simulate Button */}
          <button 
            onClick={onSimulate}
            data-testid="simulate-impact-btn"
            className="px-5 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 text-[10px] font-bold uppercase tracking-[0.2em] relative overflow-hidden group"
          >
            <span className="relative z-10">{t.nav.simulate}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={toggleTheme}
            data-testid="theme-toggle-mobile"
            className="p-2 rounded-full hover:bg-muted transition-all duration-300"
          >
            {theme === 'dark' ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-slate-700" />}
          </button>
          <button 
            onClick={toggleLanguage}
            data-testid="language-toggle-mobile"
            className="p-2 rounded-full hover:bg-muted transition-all duration-300 text-xs font-bold"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          <button 
            onClick={onSimulate}
            data-testid="simulate-impact-btn-mobile"
            className="px-3 py-1.5 bg-red-600 text-white rounded-full text-[9px] font-bold hover:bg-red-700 transition-all duration-300"
          >
            {t.nav.simulate}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
