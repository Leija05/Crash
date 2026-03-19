import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

const ArchitectureSection = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <section 
      id="arquitectura" 
      data-testid="architecture-section"
      className={`rounded-[3rem] border p-10 md:p-16 relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-white/5 to-transparent border-white/10' 
          : 'bg-gradient-to-br from-black/5 to-transparent border-black/10'
      }`}
    >
      {/* Background Effect */}
      <div className={`absolute top-0 right-0 w-[400px] h-[400px] blur-[150px] rounded-full ${
        theme === 'dark' ? 'bg-red-600/5' : 'bg-red-600/3'
      }`} />
      
      <div className="relative z-10">
        <h2 className="text-4xl font-black text-foreground mb-10 tracking-tight leading-none italic">
          {t.architecture.title} <span className="text-red-600">{t.architecture.highlight}</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-16">
          {/* Protocols */}
          <div className="space-y-8">
            <div className={`p-8 rounded-3xl border shadow-inner ${
              theme === 'dark' 
                ? 'bg-black/50 border-white/10 hover:border-red-600/40' 
                : 'bg-white/50 border-black/10 hover:border-red-600/40'
            } transition-all`}>
              <h4 className="text-red-500 font-black uppercase text-[10px] tracking-[0.4em] mb-6">
                {t.architecture.protocols}
              </h4>
              
              <div className="space-y-6">
                {/* I2C */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-mono text-sm text-foreground">{t.architecture.i2c.name}</p>
                    <span className="text-[10px] text-red-500 font-bold px-2 py-0.5 bg-red-500/10 rounded tracking-widest">
                      {t.architecture.i2c.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.architecture.i2c.desc}
                  </p>
                </div>
                
                <div className={`w-full h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />
                
                {/* UART */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-mono text-sm text-foreground">{t.architecture.uart.name}</p>
                    <span className="text-[10px] text-blue-500 font-bold px-2 py-0.5 bg-blue-500/10 rounded tracking-widest">
                      {t.architecture.uart.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.architecture.uart.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Code Block */}
          <div className="flex flex-col h-full">
            <h4 className="text-red-500 font-black uppercase text-[10px] tracking-[0.4em] mb-4">
              {t.architecture.algorithm}
            </h4>
            <div className={`flex-1 p-8 rounded-3xl border font-mono text-sm leading-relaxed overflow-x-auto shadow-2xl group relative ${
              theme === 'dark' 
                ? 'bg-[#050507] border-white/10 text-gray-400' 
                : 'bg-gray-900 border-gray-700 text-gray-300'
            }`}>
              {/* Terminal Header */}
              <div className={`flex items-center gap-2 mb-6 border-b pb-4 ${
                theme === 'dark' ? 'border-white/5' : 'border-gray-700'
              }`}>
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] opacity-40 uppercase font-sans font-bold">
                  {t.architecture.filename}
                </span>
              </div>
              
              {/* Code */}
              <span className="text-blue-400">// Vector de Aceleración Resultante</span><br/>
              <span className="text-purple-400 font-bold">float</span> <span className="text-white">gTotal</span> = <span className="text-cyan-400">sqrt</span>(
                <span className="text-cyan-400">pow</span>(gX, <span className="text-orange-400">2</span>) + 
                <span className="text-cyan-400">pow</span>(gY, <span className="text-orange-400">2</span>) + 
                <span className="text-cyan-400">pow</span>(gZ, <span className="text-orange-400">2</span>)
              );<br/>
              <br/>
              <span className="text-purple-400 font-bold">if</span> (gTotal &gt; <span className="text-orange-400">THRESHOLD</span>) &#123;<br/>
              &nbsp;&nbsp;Serial.<span className="text-cyan-400">println</span>(<span className="text-green-400">"CRITICAL_IMPACT"</span>);<br/>
              &nbsp;&nbsp;<span className="text-cyan-400">digitalWrite</span>(PIN_BUZZER, <span className="text-orange-400">HIGH</span>);<br/>
              &nbsp;&nbsp;<span className="text-cyan-400">sendEmergencyProtocol</span>();<br/>
              &#125;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
