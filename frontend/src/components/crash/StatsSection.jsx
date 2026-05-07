import React from 'react';

const StatsSection = ({ stats, groupBy, setGroupBy }) => {
  if (!stats) return null;

  return (
    <section id="estadisticas" className="rounded-2xl border border-zinc-700 bg-zinc-950/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">Analytics</p>
          <h2 className="text-2xl font-bold text-white">Estadísticas de Base de Datos</h2>
        </div>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white"
        >
          <option value="day">Por día</option>
          <option value="month">Por mes</option>
          <option value="year">Por año</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-700 p-4"><p className="text-zinc-400 text-xs">Total usuarios</p><p className="text-2xl font-bold text-white">{stats.total_users}</p></div>
        <div className="rounded-xl border border-zinc-700 p-4"><p className="text-zinc-400 text-xs">Total impactos</p><p className="text-2xl font-bold text-white">{stats.total_impacts}</p></div>
        <div className="rounded-xl border border-zinc-700 p-4"><p className="text-zinc-400 text-xs">Impactos reales</p><p className="text-2xl font-bold text-white">{stats.real_impacts}</p></div>
        <div className="rounded-xl border border-zinc-700 p-4"><p className="text-zinc-400 text-xs">Falsas alarmas</p><p className="text-2xl font-bold text-white">{stats.false_alarms}</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <article className="rounded-xl border border-zinc-700 p-4">
          <h3 className="text-white font-semibold mb-3">Severidad</h3>
          <ul className="text-zinc-200 text-sm space-y-2">
            {Object.entries(stats.severity_breakdown || {}).map(([level, total]) => (
              <li key={level} className="flex justify-between"><span className="capitalize">{level}</span><span>{total}</span></li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-zinc-700 p-4">
          <h3 className="text-white font-semibold mb-3">Impactos en el tiempo ({groupBy})</h3>
          <ul className="text-zinc-200 text-sm space-y-2 max-h-56 overflow-auto">
            {Object.entries(stats.impacts_over_time || {}).map(([period, total]) => (
              <li key={period} className="flex justify-between"><span>{period}</span><span>{total}</span></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};

export default StatsSection;
