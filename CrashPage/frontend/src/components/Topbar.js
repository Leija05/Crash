import { memo, useCallback, useState } from "react";
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
  connecting: "Conectando...",
  open: "En vivo",
  closed: "Reconectando...",
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
      <header className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-red-500/30 bg-white/[0.03] backdrop-blur-2xl red-accent-panel flex-wrap">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="h-8 w-8 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)] avatar-ring">
              <CrashLogo size={18} className="text-red-500" />
            </div>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-[8px] uppercase tracking-[0.4em] text-neutral-500 leading-none">Critical Response</div>
            <div className="text-sm font-bold tracking-tight leading-tight">C.R.A.S.H.</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-end">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-[9px] uppercase tracking-[0.2em] text-neutral-400 transition-all"
            title={t("settings.title")}
          >
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">{t("settings.title")}</span>
          </button>

          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-[9px] uppercase tracking-[0.2em] text-neutral-400 transition-all"
            title={t("export.title")}
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">{t("export.title")}</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-[9px] uppercase tracking-[0.15em] text-neutral-200 hidden md:flex">
            Claro
            <Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />
            Oscuro
          </label>

          <CrashStatsWidget />

          <button data-testid="open-crash-history" onClick={onOpenHistory} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 hover:border-red-400/70 hover:bg-red-500/10 text-[9px] uppercase tracking-[0.2em] text-neutral-300 hover:text-red-300 transition-all">
            <History className="h-3 w-3" />
            <span className="hidden md:inline">{t("history.title")}</span>
          </button>

          <div data-testid="ws-status" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] uppercase tracking-[0.15em] ${status === "open" ? "border-red-500/40 bg-red-500/10 text-red-300 glow-red" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            {status === "open" ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
            <span className="hidden sm:inline">{STATUS_LABEL[status] || status}</span>
          </div>

          {alertCount > 0 && (
            <div data-testid="alert-count" className="px-2.5 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-[9px] uppercase tracking-[0.15em] alert-flashing whitespace-nowrap">
              {alertCount}
            </div>
          )}

          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              <div className="text-right leading-tight hidden md:block">
                <div className="text-xs font-medium leading-tight">{user.name}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-neutral-500 leading-tight">{user.role}{user.company_name ? <span className="text-emerald-400"> · {user.company_name}</span> : null}</div>
              </div>
              <button data-testid="logout-btn" onClick={logout} className="h-7 w-7 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all group" title={t("nav.logout")}>
                <LogOut className="h-3 w-3 text-neutral-400 group-hover:text-red-400" />
              </button>
            </div>
          )}
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}

export default memo(Topbar);