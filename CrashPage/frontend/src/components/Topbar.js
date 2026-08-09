import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, WifiOff, History, Settings, Download, Sun, Moon } from "lucide-react";
import CrashStatsWidget from "./CrashStatsWidget";
import CrashLogo from "./CrashLogo";
import SettingsModal from "./SettingsModal";
import ExportModal from "./ExportModal";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n";

const CONTROL = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-[9px] uppercase tracking-[0.2em] text-neutral-400 transition-all";

function Topbar({ status, alertCount, onOpenHistory }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { theme, setTheme } = useSettings();
  const STATUS_LABEL = {
    connecting: t("topbar.statusConnecting", "Conectando..."),
    open: t("topbar.statusLive", "En vivo"),
    closed: t("topbar.statusReconnecting", "Reconectando..."),
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <>
      <header className="hud-frame flex items-center gap-2 px-3 py-2.5 rounded-2xl glass-refined red-accent-panel flex-wrap">
        {/* 01 · Identidad */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="h-8 w-8 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)] avatar-ring">
              <CrashLogo size={18} className="text-red-500" />
            </div>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-[8px] uppercase tracking-[0.4em] text-neutral-500 leading-none">Critical Response</div>
            <div className="text-sm font-bold tracking-tight leading-tight shimmer-brand">C.R.A.S.H.</div>
          </div>
        </div>

        {/* 02 · Estado del sistema */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          data-testid="ws-status"
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[9px] uppercase tracking-[0.15em] ${status === "open" ? "border-red-500/40 bg-red-500/10 text-red-300 glow-red" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}
        >
          {status === "open" ? (
            <span className="glow-dot bg-emerald-400 text-emerald-400" />
          ) : (
            <WifiOff className="h-2.5 w-2.5" />
          )}
          <span className="hidden sm:inline">{STATUS_LABEL[status] || status}</span>
          {alertCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              data-testid="alert-count"
              className="px-1.5 py-0.5 rounded border border-red-500/50 bg-red-500/20 text-red-300 alert-flashing tabular-nums"
            >
              {alertCount}
            </motion.span>
          )}
        </motion.div>

        <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-end">
          {/* 03 · Estadísticas en vivo */}
          <CrashStatsWidget />
          <div className="w-px h-5 bg-white/10 hidden md:block" />

          {/* 04 · Acciones */}
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            data-testid="open-crash-history"
            onClick={onOpenHistory}
            className={`${CONTROL} border-red-500/30 hover:border-red-400/70 hover:bg-red-500/10 text-neutral-300 hover:text-red-300`}
          >
            <History className="h-3 w-3" />
            <span className="hidden md:inline">{t("history.title")}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSettingsOpen(true)}
            className={CONTROL}
            title={t("settings.title")}
          >
            <Settings className="h-3 w-3" />
            <span className="hidden md:inline">{t("settings.title")}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setExportOpen(true)}
            className={`${CONTROL} hover:border-emerald-500/30 hover:bg-emerald-500/10`}
            title={t("export.title")}
          >
            <Download className="h-3 w-3" />
            <span className="hidden md:inline">{t("export.title")}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleThemeToggle}
            className="h-7 w-7 rounded-lg border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 flex items-center justify-center transition-all"
            title={theme === "dark" ? t("topbar.light", "Claro") : t("topbar.dark", "Oscuro")}
          >
            {theme === "dark" ? <Sun className="h-3 w-3 text-amber-300" /> : <Moon className="h-3 w-3 text-neutral-300" />}
          </motion.button>

          <div className="w-px h-5 bg-white/10 hidden md:block" />

          {/* 05 · Sesión */}
          {user && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5"
            >
              <div className="text-right leading-tight hidden md:block">
                <div className="text-xs font-medium leading-tight">{user.name}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-neutral-500 leading-tight">{user.role}{user.company_name ? <span className="text-emerald-400"> · {user.company_name}</span> : null}</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                data-testid="logout-btn"
                onClick={logout}
                className="h-7 w-7 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all group"
                title={t("nav.logout")}
              >
                <LogOut className="h-3 w-3 text-neutral-400 group-hover:text-red-400" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}

export default memo(Topbar);
