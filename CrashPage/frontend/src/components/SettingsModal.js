import { useI18n } from "../i18n";
import { useSettings } from "../context/SettingsContext";
import { X, Sun, Moon, Globe, Volume2, Bell, Gauge } from "lucide-react";

export default function SettingsModal({ open, onClose }) {
  const { t, locales } = useI18n();
  const {
    theme, setTheme,
    locale, setLocale,
    soundEnabled, setSoundEnabled,
    pushEnabled, setPushEnabled,
    alertThreshold, setAlertThreshold,
  } = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 glass-card p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("settings.title")}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center transition-all">
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 flex items-center gap-1.5">
              <Sun className="h-3 w-3" /> {t("settings.theme")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    theme === t
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/20"
                  }`}
                >
                  {t === "dark" ? <Moon className="h-3.5 w-3.5 inline mr-1.5" /> : <Sun className="h-3.5 w-3.5 inline mr-1.5" />}
                  {t === "dark" ? t("settings.dark") : t("settings.light")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> {t("settings.language")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    locale === l.code
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/20"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-neutral-400" />
              <span className="text-sm">{t("settings.soundEnabled")}</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`h-6 w-11 rounded-full transition-all ${
                soundEnabled ? "bg-emerald-500" : "bg-white/10"
              }`}
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-all shadow ${
                soundEnabled ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-neutral-400" />
              <span className="text-sm">{t("settings.pushEnabled")}</span>
            </div>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`h-6 w-11 rounded-full transition-all ${
                pushEnabled ? "bg-emerald-500" : "bg-white/10"
              }`}
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-all shadow ${
                pushEnabled ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 flex items-center gap-1.5">
              <Gauge className="h-3 w-3" /> {t("settings.threshold")}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="text-center text-sm font-mono text-neutral-300 mt-1">
              {alertThreshold}G
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-neutral-600 pt-3 border-t border-white/5">
          C.R.A.S.H. v2.0 &middot; {t("settings.about")}
        </div>
      </div>
    </div>
  );
}