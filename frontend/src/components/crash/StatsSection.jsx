import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];

const StatsSection = ({ stats, groupBy, setGroupBy, isOpen, onClose }) => {
  if (!isOpen || !stats) return null;

  const impactsData = Object.entries(stats.impacts_over_time || {}).map(([period, total]) => ({ period, total }));
  const severityData = Object.entries(stats.severity_breakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <section
        id="estadisticas"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[92vh] overflow-auto rounded-2xl border border-border bg-background text-foreground p-6 space-y-6 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">Analytics</p>
            <h2 className="text-2xl font-bold">Estadísticas de Base de Datos</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-muted border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="day">Por día</option>
              <option value="month">Por mes</option>
              <option value="year">Por año</option>
            </select>
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500">Cerrar</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Total usuarios" value={stats.total_users} />
          <Card title="Total impactos" value={stats.total_impacts} />
          <Card title="Impactos reales" value={stats.real_impacts} />
          <Card title="Falsas alarmas" value={stats.false_alarms} />
          <Card title="Visitas Innovatec" value={stats.innovatec_visits_total || 0} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title={`Impactos por ${groupBy}`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={impactsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Severidad de impactos">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Distribución de severidad">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                {severityData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="rounded-xl border border-border p-4 bg-card">
    <p className="text-muted-foreground text-xs">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <article className="rounded-xl border border-border p-4 bg-card">
    <h3 className="font-semibold mb-3">{title}</h3>
    {children}
  </article>
);

export default StatsSection;
