import React from "react";
import { useLanguage } from '@/contexts/LanguageContext';

const DifferenceSection = () => {
  const { t } = useLanguage();

  return (
    <section id="diferencia" data-testid="difference-section" className="space-y-10">
      <div className="max-w-3xl">
        <h2 className="text-4xl font-black text-foreground mb-6 leading-none tracking-tight">
          {t.difference.title}
        </h2>
        <p className="text-lg text-muted-foreground">
          {t.difference.description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {t.difference.points.map((point) => (
          <article
            key={point.title}
            className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-foreground mb-2">{point.title}</h3>
            <p className="text-muted-foreground mb-4">{point.summary}</p>
            <ul className="space-y-2 text-sm text-foreground/90">
              {point.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
        <table className="w-full text-left text-sm md:text-base">
          <caption className="px-5 py-4 text-left font-semibold text-foreground">
            {t.difference.comparisonTitle}
          </caption>
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th className="px-5 py-3">{t.difference.comparisonHeaders.feature}</th>
              <th className="px-5 py-3">{t.difference.comparisonHeaders.app}</th>
              <th className="px-5 py-3">{t.difference.comparisonHeaders.crash}</th>
            </tr>
          </thead>
          <tbody>
            {t.difference.comparisonRows.map((row) => (
              <tr key={row.feature} className="border-t border-border/70 align-top">
                <th className="px-5 py-3 font-semibold text-foreground">{row.feature}</th>
                <td className="px-5 py-3 text-muted-foreground">{row.app}</td>
                <td className="px-5 py-3 text-foreground">{row.crash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DifferenceSection;
