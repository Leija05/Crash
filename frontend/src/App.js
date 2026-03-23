import React, { useState, useEffect, useCallback } from 'react';
import "@/App.css";
import axios from 'axios';

// Contexts
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

// Components
import {
  Navbar,
  HeroSection,
  ProblemSection,
  HardwareSection,
  ArchitectureSection,
  AISection,
  ShowcaseSections,
  Footer
} from '@/components/crash';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Main CRASH Application Component
 * Smart Impact Detector with Gemini AI Integration
 */
const CrashApp = () => {
  const { language } = useLanguage();
  
  // State
  const [scrolled, setScrolled] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [gForce, setGForce] = useState(1.0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Scroll handler for navbar effects
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate normal G-Force fluctuations when no alert
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAlertActive) {
        setGForce(1.0 + (Math.random() * 0.2));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAlertActive]);

  // Trigger impact simulation
  const triggerTest = useCallback(() => {
    const force = 8.4 + (Math.random() * 5);
    setGForce(force);
    setIsAlertActive(true);
    setAiAnalysis(null);
    
    // Alert lasts 15 seconds for user interaction
    setTimeout(() => {
      setIsAlertActive(false);
      setGForce(1.0);
    }, 15000);
  }, []);

  // Cancel alert manually
  const cancelAlert = useCallback(() => {
    setIsAlertActive(false);
    setGForce(1.0);
    setAiAnalysis(null);
  }, []);

  // Analyze crash severity with Gemini AI via backend
  const analyzeCrashSeverity = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await axios.post(`${API}/analyze-crash`, {
        g_force: gForce,
        language: language
      });
      
      setAiAnalysis({
        severity: response.data.severity,
        probable_injuries: response.data.probable_injuries,
        first_aid_steps: response.data.first_aid_steps
      });
    } catch (error) {
      console.error('Error analyzing crash:', error);
      // Fallback response on error
      setAiAnalysis({
        severity: language === 'es' ? 'Error' : 'Error',
        probable_injuries: [language === 'es' ? 'No se pudo analizar' : 'Could not analyze'],
        first_aid_steps: [language === 'es' ? 'Intente de nuevo' : 'Please try again']
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [gForce, language]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-red-500/30">
      {/* Navigation */}
      <Navbar 
        scrolled={scrolled} 
        onSimulate={triggerTest} 
      />

      {/* Hero Section */}
      <HeroSection 
        gForce={gForce} 
        isAlertActive={isAlertActive} 
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 space-y-32 pb-32">
        {/* Problem Section */}
        <ProblemSection />

        {/* Hardware Section */}
        <HardwareSection />

        {/* Architecture Section */}
        <ArchitectureSection />

        {/* AI Section with Mobile Mockup */}
        <AISection 
          isAlertActive={isAlertActive}
          isAnalyzing={isAnalyzing}
          aiAnalysis={aiAnalysis}
          onAnalyze={analyzeCrashSeverity}
          onCancelAlert={cancelAlert}
        />

        {/* Showcase and exposition sections */}
        <ShowcaseSections />
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Emergency Alert Overlay */}
      {isAlertActive && (
        <div 
          data-testid="emergency-overlay"
          className="fixed inset-0 z-[100] pointer-events-none border-[32px] border-red-600/20 animate-pulse mix-blend-overlay" 
        />
      )}
    </div>
  );
};

/**
 * App Wrapper with Providers
 */
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CrashApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
