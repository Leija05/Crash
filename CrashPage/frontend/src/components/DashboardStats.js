import { useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";
import { useI18n } from "../i18n";
import { TrendingUp, Users, AlertTriangle, Activity, BarChart3 } from "lucide-react";

export default function DashboardStats() {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/analytics?days=7"),
        ]);
        if (!mounted) return;
        setStats(sRes.data);
        setAnalytics(aRes.data);
      } catch (e) {
        if (mounted) setError(formatApiError(e));
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 skeleton-premium h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: t("stats.totalDrivers"),
      value: stats.total_drivers,
      sub: `${stats.active_drivers} ${t("stats.activeNow")}`,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: t("stats.impactsToday"),
      value: stats.impacts_last_24h,
      sub: `${t("stats.totalImpacts")}: ${stats.total_impacts}`,
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: t("dashboard.criticalAlerts"),
      value: stats.critical_alerts,
      sub: `${stats.pending_alerts} ${t("alerts.pending")}`,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: t("dashboard.systemHealth"),
      value: `${stats.active_drivers}/${stats.total_drivers}`,
      sub: t("dashboard.connected"),
      icon: BarChart3,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
        <TrendingUp className="h-3.5 w-3.5" />
        {t("stats.title")}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} ${card.bg} backdrop-premium p-4 hover-lift`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              <div className="text-[10px] text-neutral-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {analytics && (
        <div className="rounded-2xl border border-white/10 glass-card p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-3 flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" />
            {t("stats.bySeverity")} ({t("stats.lastDays")} 7)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: "low", label: t("alerts.low"), color: "bg-emerald-500" },
              { key: "medium", label: t("alerts.medium"), color: "bg-amber-500" },
              { key: "high", label: t("alerts.high"), color: "bg-orange-500" },
              { key: "critical", label: t("alerts.critical"), color: "bg-red-500" },
            ].map((sev) => {
              const count = analytics.severity_distribution[sev.key] || 0;
              const max = Math.max(
                ...Object.values(analytics.severity_distribution),
                1
              );
              const pct = (count / max) * 100;
              return (
                <div key={sev.key} className="text-center">
                  <div className="text-xs font-mono text-neutral-300">{count}</div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sev.color} transition-all`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-neutral-500 mt-1">{sev.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}