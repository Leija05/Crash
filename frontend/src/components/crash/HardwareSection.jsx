import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Cpu, Zap, Bluetooth, Box, Smartphone, Info } from 'lucide-react';

// Hardware Card Component
const HardwareCard = ({ title, icon: Icon, children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`backdrop-blur-lg border p-6 rounded-2xl hover:border-red-500/50 transition-all duration-300 group ${
      theme === 'dark' 
        ? 'bg-white/5 border-white/10' 
        : 'bg-black/5 border-black/10'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
          <Icon className="text-red-500" size={24} />
        </div>
        <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">{title}</h3>
      </div>
      <div className="text-muted-foreground leading-relaxed text-sm">
        {children}
      </div>
    </div>
  );
};

const HardwareSection = () => {
  const { t } = useLanguage();

  const hardwareItems = [
    { key: 'mcu', icon: Cpu },
    { key: 'sensor', icon: Zap },
    { key: 'radio', icon: Bluetooth },
    { key: 'case', icon: Box },
    { key: 'app', icon: Smartphone },
    { key: 'power', icon: Info }
  ];

  return (
    <section id="hardware" data-testid="hardware-section">
      <div className="text-center mb-20">
        <div className="inline-block px-4 py-1 bg-red-600/10 border border-red-600/20 rounded-full text-[10px] font-black text-red-500 mb-4 tracking-[0.4em] uppercase">
          {t.hardware.badge}
        </div>
        <h2 className="text-5xl font-black text-foreground mb-6 tracking-tight italic">
          {t.hardware.title} <span className="text-red-600">{t.hardware.highlight}</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t.hardware.subtitle}
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {hardwareItems.map(({ key, icon }) => (
          <HardwareCard 
            key={key} 
            title={t.hardware.items[key].title} 
            icon={icon}
          >
            {t.hardware.items[key].desc}
          </HardwareCard>
        ))}
      </div>
    </section>
  );
};

export default HardwareSection;
