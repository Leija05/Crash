import { useI18n } from "../i18n";
import { useSettings } from "../context/SettingsContext";
import { Sun, Moon, Globe, Volume2, Bell, Gauge } from "lucide-react";
import PremiumModal from "./ui/Modal";

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
    <PremiumModal
      open
      onClose={onClose}
      title={t("settings.title")}
      eyebrow="C.R.A.S.H. · Configuración"
      accent="emerald"
      size="md"
      testId="settings-modal"
    >
      <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 flex items-center gap-1.5">
              <Sun className="h-3 w-3" /> {t("settings.theme")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["dark", "light"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    theme === mode
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/20"
                  }`}
                >
                  {mode === "dark" ? <Moon className="h-3.5 w-3.5 inline mr-1.5" /> : <Sun className="h-3.5 w-3.5 inline mr-1.5" />}
                  {mode === "dark" ? t("settings.dark") : t("settings.light")}
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
                  {l.native || l.label}
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

        <div className="text-center text-[10px] text-neutral-600 pt-3 border-t border-white/10">
          C.R.A.S.H. v2.0 &middot; {t("settings.about")}
        </div>
    </PremiumModal>
  );
}