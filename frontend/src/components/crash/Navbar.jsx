import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldAlert, Sun, Moon, Globe } from 'lucide-react';

const Navbar = ({ scrolled, onSimulate }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <nav 
      data-testid="navbar"
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-md py-4 shadow-xl border-b border-border' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-black text-white italic text-xl">
            C
          </div>
          <span className="text-2xl font-black tracking-tighter text-foreground">C.R.A.S.H.</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
            <a 
              href="#problema" 
              data-testid="nav-problem"
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              {t.nav.problem}
            </a>
            <a 
              href="#arquitectura" 
              data-testid="nav-architecture"
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              {t.nav.architecture}
            </a>
            <a 
              href="#hardware" 
              data-testid="nav-hardware"
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              {t.nav.hardware}
            </a>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-yellow-500" />
            ) : (
              <Moon size={18} className="text-slate-700" />
            )}
          </button>
          
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            data-testid="language-toggle"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-muted transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <Globe size={14} />
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          
          {/* Simulate Button */}
          <button 
            onClick={onSimulate}
            data-testid="simulate-impact-btn"
            className="px-4 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            {t.nav.simulate}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={toggleTheme}
            data-testid="theme-toggle-mobile"
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-slate-700" />}
          </button>
          <button 
            onClick={toggleLanguage}
            data-testid="language-toggle-mobile"
            className="p-2 rounded-full hover:bg-muted transition-colors text-xs font-bold"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          <button 
            onClick={onSimulate}
            data-testid="simulate-impact-btn-mobile"
            className="px-3 py-1.5 bg-red-600 text-white rounded-full text-[9px] font-bold"
          >
            {t.nav.simulate}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
