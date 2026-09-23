import { memo, useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Hls from "hls.js";
import { useI18n } from "../i18n";

const MUX_SRC = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";
const FALLBACK_SRC = "/videos/CrashVideo.mp4";

function useHlsVideo(videoRef) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls = null;

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(MUX_SRC);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal && video.getAttribute("src") !== FALLBACK_SRC) {
          hls.destroy();
          hls = null;
          video.setAttribute("src", FALLBACK_SRC);
          video.play().catch(() => {});
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = MUX_SRC;
      video.addEventListener("error", () => {
        if (video.getAttribute("src") !== FALLBACK_SRC) {
          video.setAttribute("src", FALLBACK_SRC);
          video.play().catch(() => {});
        }
      });
    }

    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0.15 }
      );
      io.observe(video);
    }

    return () => {
      if (io) io.disconnect();
      if (hls) hls.destroy();
    };
  }, [videoRef]);
}

const CtaFooter = ({ brand, onPlansClick, onBookCall, onBrandClick }) => {
  const { t } = useI18n();
  const videoRef = useRef(null);

  useHlsVideo(videoRef);

  const heading = t("landing.ctaHeading", "Tu pr\u00f3ximo trayecto empieza aqu\u00ed.");
  const words = heading.split(" ");

  return (
    <section className="relative cta-dark bg-black py-32 px-6 md:px-16 lg:px-24 text-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        aria-hidden
      />

      <div className="absolute inset-0 z-[1] bg-black/70 pointer-events-none" />
      <div className="absolute inset-0 z-[1] opacity-40 scanlines pointer-events-none" />
      <div
        className="absolute top-0 left-0 right-0 z-[2] pointer-events-none"
        style={{ height: "200px", background: "linear-gradient(to bottom, black, transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
        style={{ height: "200px", background: "linear-gradient(to top, black, transparent)" }}
      />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 border border-white/15 rounded-full px-4 py-1.5 text-xs font-mono text-zinc-300 mb-8 glass-refined">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
          {t("landing.ctaBadge", "Protecci\u00f3n activa \u00b7 Monitoreo en vivo")}
        </div>

        <h2 className="text-white font-bold font-mono text-3xl sm:text-5xl lg:text-[3.4rem] tracking-tight max-w-3xl mx-auto leading-[1.06] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] mb-6">
          {words.map((w, i) => {
            const accent = i >= words.length - 2;
            return (
              <span
                key={`${w}-${i}`}
                className={`inline-block mr-[0.26em] ${accent ? "bg-gradient-to-r from-red-500 via-red-400 to-orange-300 bg-clip-text text-transparent" : ""}`}
              >
                {w}
              </span>
            );
          })}
        </h2>

        <p className="text-zinc-200 text-base md:text-lg max-w-xl mx-auto mb-8 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {t("landing.ctaSub", "Agenda una llamada estrat\u00e9gica. Conoce c\u00f3mo la IA de C.R.A.S.H. detecta impactos, analiza la gravedad y alerta a tus contactos en segundos. Sin compromiso, sin presi\u00f3n. Solo protecci\u00f3n.")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <button
            type="button"
            onClick={onBookCall}
            className="liquid-glass-strong rounded-full px-6 py-3 text-sm font-bold text-white flex items-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all font-mono cursor-pointer"
          >
            {t("landing.ctaCall", "Agendar llamada")}
            <ArrowUpRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onPlansClick}
            className="bg-white text-black rounded-full px-6 py-3 text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all font-mono cursor-pointer"
          >
            {t("landing.ctaPlans", "Ver planes")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 hud-ticker text-zinc-300 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-semibold">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />{t("landing.ctaTicker1", "SENSORES EN LÍNEA")}</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />{t("landing.ctaTicker2", "RESPUESTA < 8.2s")}</span>
          <span className="tick-blink text-red-400">▌</span>
        </div>

        <div className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onBrandClick}
              className="flex items-center gap-3 text-left rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              aria-label={t("landing.backToTop", "Volver al inicio")}
            >
              {brand}
            </button>
            <p className="text-zinc-400 font-mono font-medium text-xs">
              &copy; 2026 C.R.A.S.H. v3.2.1 {t("landing.ctaRights", "· Hecho en México")}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { key: "privacy", label: t("landing.ctaPrivacy", "Privacidad") },
              { key: "terms", label: t("landing.ctaTerms", "Términos") },
              { key: "contact", label: t("landing.ctaContact", "Contacto") },
            ].map((link) => (
              <a
                key={link.key}
                href={`#${link.key}`}
                onClick={(e) => e.preventDefault()}
                className="text-zinc-400 hover:text-white font-mono font-medium text-xs transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default memo(CtaFooter);
