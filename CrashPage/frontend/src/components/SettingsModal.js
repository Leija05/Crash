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
            <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 font-semibold mb-2 flex items-center gap-1.5 font-mono">
              <Sun className="h-3.5 w-3.5 text-amber-400" /> {t("settings.theme")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["dark", "light"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    theme === mode
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "border-white/15 bg-white/[0.04] text-zinc-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {mode === "dark" ? <Moon className="h-3.5 w-3.5 inline mr-1.5" /> : <Sun className="h-3.5 w-3.5 inline mr-1.5" />}
                  {mode === "dark" ? t("settings.dark") : t("settings.light")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 font-semibold mb-2 flex items-center gap-1.5 font-mono">
              <Globe className="h-3.5 w-3.5 text-cyan-400" /> {t("settings.language")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    locale === l.code
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "border-white/15 bg-white/[0.04] text-zinc-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {l.native || l.label}
                </button>
              ))}
            </div>
          </div>


          <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-zinc-300" />
              <span className="text-sm font-medium text-zinc-100">{t("settings.soundEnabled")}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.45)]"
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                  soundEnabled ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-zinc-300" />
              <span className="text-sm font-medium text-zinc-100">{t("settings.pushEnabled")}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushEnabled}
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 cursor-pointer ${
                pushEnabled
                  ? "bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.45)]"
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                  pushEnabled ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 font-semibold mb-2 flex items-center gap-1.5 font-mono">
              <Gauge className="h-3.5 w-3.5 text-red-400" /> {t("settings.threshold")}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="text-center text-sm font-mono font-bold text-white mt-1.5 flex items-center justify-center gap-2">
              <span className="text-emerald-400">{alertThreshold}G</span>
              <span className="text-zinc-500 text-xs">(Umbral anti-falsos: 4.0G · Choque: 10.0G)</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-zinc-400 font-mono pt-3 border-t border-white/10">
          C.R.A.S.H. v3.2.1 &middot; {t("settings.about")}
        </div>
    </PremiumModal>
  );
}