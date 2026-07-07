import { memo, useCallback, useEffect, useState } from "react";
import { LogOut, Wifi, WifiOff, History, Settings, Download } from "lucide-react";
import CrashStatsWidget from "./CrashStatsWidget";
import CrashLogo from "./CrashLogo";
import SettingsModal from "./SettingsModal";
import ExportModal from "./ExportModal";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n";
import { Switch } from "./ui/switch";

const STATUS_LABEL = {
  connecting: "Conectando",
  open: "En vivo",
  closed: "Reconectando",
};

function Topbar({ status, alertCount, onOpenHistory }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { theme, setTheme } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handleThemeChange = useCallback((checked) => {
    setTheme(checked ? "dark" : "light");
  }, [setTheme]);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 rounded-2xl border border-red-500/30 bg-white/[0.03] backdrop-blur-2xl red-accent-panel">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)] avatar-ring">
              <CrashLogo size={22} className="text-red-500" />
            </div>
          </div>
          <div className="leading-tight">
            <div className="text-[9px] uppercase tracking-[0.4em] text-neutral-500">Critical Response Alert System</div>
            <div className="font-bold tracking-tight">C.R.A.S.H. - Monitoring</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition-all"
            title={t("settings.title")}
          >
            <Settings className="h-3.5 w-3.5" />
            {t("settings.title")}
          </button>

          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition-all"
            title={t("export.title")}
          >
            <Download className="h-3.5 w-3.5" />
            {t("export.title")}
          </button>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] uppercase tracking-[0.2em] text-neutral-200">
            Claro
            <Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />
            Oscuro
          </label>

          <CrashStatsWidget />

          <button data-testid="open-crash-history" onClick={onOpenHistory} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-400/70 hover:bg-red-500/10 text-[10px] uppercase tracking-[0.25em] text-neutral-300 hover:text-red-300 transition-all" title="Historial completo de choques">
            <History className="h-3.5 w-3.5" />{t("history.title")}
          </button>

          <div data-testid="ws-status" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] uppercase tracking-[0.25em] ${status === "open" ? "border-red-500/40 bg-red-500/10 text-red-300 glow-red" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            {status === "open" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {STATUS_LABEL[status] || status}
          </div>

          {alertCount > 0 ? (
            <div data-testid="alert-count" className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-[10px] uppercase tracking-[0.25em] alert-flashing">
              {alertCount} alerta{alertCount > 1 ? "s" : ""} crítica{alertCount > 1 ? "s" : ""}
            </div>
          ) : null}

          {user ? (
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">{user.role}</div>
              </div>
              <button data-testid="logout-btn" onClick={logout} className="ml-2 h-9 w-9 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all group" title={t("nav.logout")}>
                <LogOut className="h-4 w-4 text-neutral-400 group-hover:text-red-400" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}

export default memo(Topbar);