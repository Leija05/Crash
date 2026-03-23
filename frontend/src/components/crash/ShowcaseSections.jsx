import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowRight,
  CheckCircle2,
  CirclePlay,
  Gauge,
  Lightbulb,
  MessageSquareQuote,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
} from 'lucide-react';

const sectionSurface = (theme) => (
  theme === 'dark'
    ? 'bg-white/5 border-white/10'
    : 'bg-black/5 border-black/10'
);

const titleAccent = 'text-red-600';

const iconMap = {
  Lightbulb,
  ShieldCheck,
  Rocket,
  Target,
  Users,
  Sparkles,
  Gauge,
  Wrench,
  CirclePlay,
  QrCode,
  MessageSquareQuote,
  CheckCircle2,
};

const SectionHeader = ({ eyebrow, title, highlight, description, align = 'left' }) => (
  <div className={align === 'center' ? 'text-center max-w-3xl mx-auto mb-16' : 'max-w-3xl mb-12'}>
    {eyebrow && (
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.35em] mb-5">
        <Sparkles size={14} />
        {eyebrow}
      </div>
    )}
    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none italic mb-5">
      {title} {highlight && <span className={titleAccent}>{highlight}</span>}
    </h2>
    {description && (
      <p className="text-muted-foreground text-lg leading-relaxed font-medium">
        {description}
      </p>
    )}
  </div>
);

const IconCard = ({ item, theme }) => {
  const Icon = iconMap[item.icon] || Sparkles;

  return (
    <article className={`rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 ${sectionSurface(theme)}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-5">
        <Icon size={22} />
      </div>
      <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">{item.title}</h3>
      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
    </article>
  );
};

const ShowcaseSections = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <>
      <section id="solucion" data-testid="solution-section" className="space-y-14">
        <SectionHeader
          eyebrow={t.solution.badge}
          title={t.solution.title}
          highlight={t.solution.highlight}
          description={t.solution.description}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {t.solution.cards.map((item) => (
            <IconCard key={item.title} item={item} theme={theme} />
          ))}
        </div>

        <div className={`rounded-[2.5rem] border p-8 md:p-10 ${sectionSurface(theme)}`}>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <h3 className="text-2xl font-black text-foreground mb-4">{t.solution.processTitle}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">{t.solution.processDescription}</p>

              <div className="grid md:grid-cols-3 gap-6">
                {t.solution.steps.map((step, index) => (
                  <div key={step.title} className={`rounded-[1.75rem] border p-6 ${sectionSurface(theme)}`}>
                    <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-4">
                      0{index + 1}
                    </div>
                    <h4 className="text-lg font-black text-foreground mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-[2rem] border p-6 md:p-8 ${theme === 'dark' ? 'bg-[#09090f] border-white/10' : 'bg-white border-black/10'}`}>
              <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-4">{t.solution.valueTitle}</div>
              <h4 className="text-2xl font-black text-foreground mb-4">{t.solution.valueHeadline}</h4>
              <ul className="space-y-4">
                {t.solution.valueBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 items-start text-muted-foreground">
                    <CheckCircle2 size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" data-testid="benefits-section" className="grid xl:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <div>
          <SectionHeader
            eyebrow={t.benefits.badge}
            title={t.benefits.title}
            highlight={t.benefits.highlight}
            description={t.benefits.description}
          />
          <div className="grid md:grid-cols-2 gap-6">
            {t.benefits.items.map((item) => (
              <IconCard key={item.title} item={item} theme={theme} />
            ))}
          </div>
        </div>

        <div id="usuarios" className={`rounded-[2.5rem] border p-8 md:p-10 sticky top-24 ${sectionSurface(theme)}`}>
          <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-4">{t.audience.badge}</div>
          <h3 className="text-3xl font-black text-foreground tracking-tight mb-4">{t.audience.title}</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">{t.audience.description}</p>
          <div className="space-y-4">
            {t.audience.segments.map((segment) => (
              <div key={segment.title} className={`rounded-[1.75rem] border p-5 ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white/60 border-black/10'}`}>
                <h4 className="text-lg font-black text-foreground mb-1">{segment.title}</h4>
                <p className="text-sm text-muted-foreground">{segment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" data-testid="demo-section" className="space-y-12">
        <SectionHeader
          eyebrow={t.demo.badge}
          title={t.demo.title}
          highlight={t.demo.highlight}
          description={t.demo.description}
          align="center"
        />

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
          <div className={`rounded-[2.5rem] border p-8 md:p-10 relative overflow-hidden ${sectionSurface(theme)}`}>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.35em] text-red-500 mb-5">
                <CirclePlay size={14} />
                {t.demo.videoLabel}
              </div>
              <h3 className="text-3xl font-black text-foreground mb-4">{t.demo.videoTitle}</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">{t.demo.videoDescription}</p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {t.demo.highlights.map((item) => (
                  <div key={item.title} className={`rounded-[1.5rem] border p-5 ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white/70 border-black/10'}`}>
                    <div className="text-2xl font-black text-red-500 mb-2">{item.value}</div>
                    <div className="text-sm font-bold text-foreground mb-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                ))}
              </div>

              <div className={`rounded-[2rem] border p-6 ${theme === 'dark' ? 'bg-[#0b0b13] border-white/10' : 'bg-white border-black/10'}`}>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.35em] text-red-500 mb-2">{t.demo.galleryLabel}</div>
                    <h4 className="text-xl font-black text-foreground">{t.demo.galleryTitle}</h4>
                  </div>
                  <ArrowRight className="text-red-500" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {t.demo.gallery.map((item) => (
                    <div key={item.title} className={`rounded-[1.5rem] p-5 border ${sectionSurface(theme)}`}>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-3">{item.kicker}</div>
                      <div className="text-lg font-black text-foreground mb-2">{item.title}</div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className={`rounded-[2.5rem] border p-8 ${sectionSurface(theme)}`}>
              <div className="flex items-center gap-3 mb-5 text-red-500">
                <QrCode size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.35em]">{t.demo.qrLabel}</span>
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">{t.demo.qrTitle}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{t.demo.qrDescription}</p>
              <div className={`rounded-[2rem] border border-dashed p-8 text-center ${theme === 'dark' ? 'border-red-500/30 bg-red-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="w-24 h-24 mx-auto rounded-3xl border border-red-500/30 flex items-center justify-center text-red-500 mb-4">
                  <QrCode size={44} />
                </div>
                <p className="text-sm text-muted-foreground">{t.demo.qrCaption}</p>
              </div>
            </div>

            <div className={`rounded-[2.5rem] border p-8 ${sectionSurface(theme)}`}>
              <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-5">{t.demo.timelineLabel}</div>
              <div className="space-y-5">
                {t.demo.timeline.map((item, index) => (
                  <div key={item.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="diferenciador" data-testid="differentiators-section" className="grid xl:grid-cols-[1fr_1fr] gap-8 items-start">
        <div className={`rounded-[2.5rem] border p-8 md:p-10 ${sectionSurface(theme)}`}>
          <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-4">{t.differentiators.badge}</div>
          <h3 className="text-3xl font-black text-foreground mb-4">{t.differentiators.title}</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">{t.differentiators.description}</p>
          <div className="space-y-4">
            {t.differentiators.items.map((item) => (
              <div key={item.title} className={`rounded-[1.75rem] border p-5 ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white/70 border-black/10'}`}>
                <div className="text-lg font-black text-foreground mb-1">{item.title}</div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="validacion" className={`rounded-[2.5rem] border p-8 md:p-10 ${sectionSurface(theme)}`}>
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <MessageSquareQuote size={22} />
            <span className="text-[10px] font-black uppercase tracking-[0.35em]">{t.validation.badge}</span>
          </div>
          <h3 className="text-3xl font-black text-foreground mb-4">{t.validation.title}</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">{t.validation.description}</p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {t.validation.metrics.map((item) => (
              <div key={item.label} className={`rounded-[1.5rem] border p-5 text-center ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white/70 border-black/10'}`}>
                <div className="text-3xl font-black text-red-500 mb-2">{item.value}</div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-foreground mb-1">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.caption}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {t.validation.testimonials.map((item) => (
              <blockquote key={item.name} className={`rounded-[1.75rem] border p-5 ${theme === 'dark' ? 'bg-[#0b0b13] border-white/10' : 'bg-white border-black/10'}`}>
                <p className="text-foreground font-medium mb-3">“{item.quote}”</p>
                <footer className="text-sm text-muted-foreground">
                  <span className="font-black text-foreground">{item.name}</span>
                  <span> · {item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="impacto" data-testid="impact-section" className="space-y-12">
        <SectionHeader
          eyebrow={t.impact.badge}
          title={t.impact.title}
          highlight={t.impact.highlight}
          description={t.impact.description}
          align="center"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {t.impact.stats.map((item) => (
            <div key={item.label} className={`rounded-[2rem] border p-8 text-center ${sectionSurface(theme)}`}>
              <div className="text-4xl md:text-5xl font-black text-red-500 mb-3">{item.value}</div>
              <div className="text-sm font-black uppercase tracking-[0.25em] text-foreground mb-2">{item.label}</div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
          <div id="equipo" className={`rounded-[2.5rem] border p-8 md:p-10 ${sectionSurface(theme)}`}>
            <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-4">{t.team.badge}</div>
            <h3 className="text-3xl font-black text-foreground mb-4">{t.team.title}</h3>
            <p className="text-muted-foreground leading-relaxed mb-8">{t.team.description}</p>
            <div className="grid sm:grid-cols-2 gap-5">
              {t.team.members.map((member) => (
                <div key={member.role} className={`rounded-[1.75rem] border p-5 ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white/70 border-black/10'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-black text-lg mb-4">
                    {member.initials}
                  </div>
                  <div className="text-lg font-black text-foreground">{member.role}</div>
                  <p className="text-sm text-muted-foreground mt-2">{member.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[2.5rem] border p-8 md:p-10 ${sectionSurface(theme)}`}>
            <div className="text-[10px] font-black tracking-[0.35em] text-red-500 uppercase mb-4">{t.future.badge}</div>
            <h3 className="text-3xl font-black text-foreground mb-4">{t.future.title}</h3>
            <p className="text-muted-foreground leading-relaxed mb-8">{t.future.description}</p>
            <div className="space-y-5">
              {t.future.items.map((item, index) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" data-testid="faq-section" className="space-y-12">
        <SectionHeader
          eyebrow={t.faq.badge}
          title={t.faq.title}
          highlight={t.faq.highlight}
          description={t.faq.description}
          align="center"
        />

        <div className="max-w-4xl mx-auto space-y-4">
          {t.faq.items.map((item) => (
            <details key={item.question} className={`group rounded-[1.75rem] border p-6 ${sectionSurface(theme)}`}>
              <summary className="list-none cursor-pointer flex items-center justify-between gap-4">
                <span className="text-lg font-black text-foreground">{item.question}</span>
                <span className="text-red-500 font-black text-2xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="text-muted-foreground leading-relaxed mt-4 pr-8">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contacto" data-testid="cta-section" className={`rounded-[3rem] border p-10 md:p-14 relative overflow-hidden ${sectionSurface(theme)}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10 pointer-events-none" />
        <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.35em] mb-5">
              <Rocket size={14} />
              {t.cta.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight italic mb-4">{t.cta.title}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{t.cta.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#demo" className="px-6 py-4 rounded-full bg-red-600 text-white font-black uppercase tracking-[0.2em] text-xs text-center shadow-lg shadow-red-600/30 hover:bg-red-700">
              {t.cta.primary}
            </a>
            <a href="#equipo" className={`px-6 py-4 rounded-full border font-black uppercase tracking-[0.2em] text-xs text-center ${theme === 'dark' ? 'border-white/10 text-foreground hover:bg-white/5' : 'border-black/10 text-foreground hover:bg-black/5'}`}>
              {t.cta.secondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default ShowcaseSections;
