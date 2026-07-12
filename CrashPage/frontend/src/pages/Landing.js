import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Smartphone, Cpu, Monitor, Lock, Network, Siren, Navigation,
  WifiOff, MessagesSquare, Database, ShoppingCart, X, MessageCircle, Mail,
  Check, ArrowRight, MapPin, History, Signal, Users, Building2,
  Gauge, Brain, ShieldAlert, Zap, Activity, Radar, ChevronDown, Download,
} from "lucide-react";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

const CONTACT_WHATSAPP = "5210000000000000"; // Reemplaza con el numero real de ventas C.R.A.S.H.
const CONTACT_EMAIL = "contacto@crash.io";
const CYCLES = [
  { key: "cycleSemanal", label: "Semanal" },
  { key: "cycleMensual", label: "Mensual" },
  { key: "cycleBimestral", label: "Bimestral" },
  { key: "cycleTrimestral", label: "Trimestral" },
  { key: "cycleAnual", label: "Anual" },
];
const CYCLE_MULT = { Semanal: 0.3, Mensual: 1, Bimestral: 1.9, Trimestral: 2.7, Anual: 9.6 };
const HERO = "https://images.pexels.com/photos/2611685/pexels-photo-2611685.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

// Precios base del modelo de negocio C.R.A.S.H. (MXN). Fuente: modelo de negocios del proyecto.
const B2C_DEVICE = 1499; // Dispositivo B2C (margen 46%, costo $800)
const B2C_SUB = 49;      // Suscripcion app B2C por mes
const B2B_DEVICE = 1999; // Dispositivo B2B (incluye instalacion y soporte)
const B2B_SUB_PER_DRIVER = 150; // SaaS por repartidor/mes

const mx = (n) => `$${Number(Math.round(n)).toLocaleString("es-MX")} MXN`;

const PROJECT_META = {
  evento: "Cumbre Nacional de Desarrollo Tecnológico, Emprendimiento e Innovación · InnovaTecNM 2026",
  sede: "Instituto Tecnológico de Nuevo Laredo · Etapa Local · Región 2",
  folio: "66137-17",
  categoria: "Tecnologías para la Salud Humana",
  area: "Inteligencia Artificial y Análisis de Datos en Servicios para la Salud",
  naturaleza: "Ciencias Computacionales",
  descripcion:
    "Dispositivo para cascos/vehículos que detecta impactos. Mediante IA, analiza la gravedad en una app celular y envía alertas automáticas a contactos de emergencia ante accidentes.",
};

const PROBLEMS = [
  { key: "problemHumanDependence", t: "Dependencia de intervención humana", d: "Si el conductor queda inconsciente o el accidente ocurre en un tramo aislado sin testigos, la falta de notificación genera retrasos fatales en la asistencia." },
  { key: "problemRealtimeData", t: "Falta de datos técnicos en tiempo real", d: "Los servicios de emergencia acuden 'a ciegas' sin la fuerza-G del impacto, dificultando el triaje y la preparación médica." },
  { key: "problemEPPMonitoring", t: "Inexistencia de monitoreo inteligente en EPP", d: "A diferencia de los vehículos modernos, el Equipo de Protección Personal (cascos) es pasivo y no alerta sobre traumatismos craneoencefálicos." },
];

const VALUE = [
  { key: "valueBiomech", t: "Monitoreo biomecánico dual", d: "Se adapta a cascos de seguridad industriales y a estructuras vehiculares, detectando grados de fuerza (G) durante un impacto o caída con sensores de alta precisión." },
  { key: "valueAI", t: "Triaje automatizado por IA", d: "Algoritmos de inteligencia artificial discriminan entre un golpe accidental leve y una colisión crítica, categorizando la gravedad para optimizar la respuesta médica." },
  { key: "valueOmnichannel", t: "Protocolo de alerta omnicanal", d: "Integración nativa con bot de WhatsApp y una aplicación de escritorio de alto rendimiento que envía GPS y datos del impacto a contactos y centros de control." },
];

const TEAM = [
  "Héctor Aaron Leija Zavala · Ing. en Sistemas Computacionales",
  "Víctor Manuel Martínez Sifuentes · Ing. en Sistemas Computacionales",
  "Carlos Eduardo Contreras Hernández · Ing. en Sistemas Computacionales",
  "Carlos Hiram Castillo Escobedo · Ing. en Sistemas Computacionales",
  "Raquel Hernández Villanueva · Ing. Industrial",
];

const ADVISORS = [
  "Mario Alberto Widales Cobio · marioalberto.widales@nlaredo.tecnm.mx",
  "Ludwing Daniel Oliva Perea · ludwingdaniel.op@nlaredo.tecnm.mx",
];

const NORMS = [
  { key: "normNom115", c: "NOM-115-STPS-2009", d: "Cascos de protección y especificaciones de seguridad en el entorno laboral mexicano." },
  { key: "normNom001", c: "NOM-001-SCFI-2018", d: "Aparatos electrónicos y requisitos de seguridad para su comercialización." },
  { key: "normIso45001", c: "ISO 45001", d: "Sistemas de gestión de la seguridad y salud en el trabajo." },
  { key: "normAnsi", c: "ANSI/ISEA Z89.1", d: "Requisitos de desempeño para cascos de protección industrial (absorción de impacto)." },
  { key: "normLfpdppp", c: "LFPDPPP", d: "Ley Federal de Protección de Datos Personales: privacidad de contactos y ubicación." },
];

const ARCH = [
  { key: "archHardware", t: "Hardware (Nodo Sensor)", d: "Módulo compacto montable en cascos (EPP) o chasis vehiculares con sensores MEMS (MPU-6050) para medir fuerzas G y cambios de orientación." },
  { key: "archBackend", t: "Backend (Cerebro del Sistema)", d: "FastAPI (Python) con IA (red neuronal de clasificación) que analiza la curva de aceleración para determinar severidad y probabilidad de lesiones." },
  { key: "archAlert", t: "Capa de Alerta", d: "Integración con bot de WhatsApp Business para difundir mensajes con plantillas interactivas y geolocalización precisa del incidente." },
  { key: "archInterface", t: "Interfaz de Control", d: "Aplicación web de alto rendimiento (React) con panel de monitoreo en tiempo real y estética de alto impacto visual." },
];

const HERO_SUB = [
  { key: "heroMobile", icon: Smartphone, t: "App Móvil", s: "El Escudo del Conductor", d: "Cero distracciones en marcha, caja negra offline y botón de pánico silencioso en el casco." },
  { key: "heroBackend", icon: Cpu, t: "Backend / Dispositivo", s: "El Cerebro", d: "Arduino Nano + MPU-6050 detecta impactos en milisegundos, con filtro de acelerómetro e IA de gravedad." },
  { key: "heroDashboard", icon: Monitor, t: "Dashboard Web", s: "Centro de Monitoreo", d: "WebSockets en vivo, gestión por excepción y difusión automática a contactos y autoridades." },
];

const FEATURES = [
  { key: "featureAI", icon: Cpu, t: "Detección de impacto por IA", d: "El módulo MPU-6050 con red neuronal de clasificación detecta la fuerza-G del impacto y categoriza la gravedad en milisegundos." },
  { key: "featureTriage", icon: Brain, t: "Triaje automatizado", d: "La IA discrimina entre un golpe leve y una colisión crítica, estimando la probabilidad de lesión para priorizar la respuesta médica." },
  { key: "featureAlerts", icon: MessagesSquare, t: "Alertas automáticas a contactos", d: "WhatsApp Business difunde ubicación GPS y diagnóstico del impacto a tus contactos y al centro de monitoreo de inmediato." },
  { key: "featureLive", icon: Monitor, t: "Monitoreo en vivo", d: "Centro de Control con WebSockets muestra la flotilla, telemetría y estado de cada conductor en tiempo real." },
  { key: "featureGeofence", icon: MapPin, t: "Geocercas de riesgo", d: "Zonas peligrosas (curvas, túneles, escolares) activan modo Precaución y cronometran el tiempo exacto en la zona." },
  { key: "featureBlackbox", icon: Database, t: "Caja Negra del Casco", d: "Almacena telemetría IMU local y la envía en ráfaga al recuperar la señal en zonas muertas, sin perder datos." },
];

function CrashLogo({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 333 306" className={`${className} text-red-500`} aria-hidden="true">
      <g transform="translate(0,306) scale(0.1,-0.1)" fill="currentColor" stroke="none">
        <path d="M1535 2895 c-44 -37 -295 -160 -407 -199 -179 -64 -366 -107 -573 -131 -212 -25 -202 -23 -208 -48 -3 -12 -11 -106 -18 -209 -10 -149 -10 -229 0 -390 7 -111 16 -209 20 -216 5 -9 14 2 26 35 17 42 19 72 16 255 -4 260 7 464 25 482 7 8 44 17 81 20 104 11 285 44 413 76 203 51 360 112 548 210 118 62 144 69 177 47 44 -30 176 -97 275 -140 216 -93 459 -156 743 -191 60 -8 114 -19 120 -25 8 -8 12 -111 14 -325 2 -264 5 -320 19 -355 9 -22 20 -41 24 -41 9 0 17 67 26 215 5 106 -10 504 -22 552 -7 27 -2 26 -199 48 -371 41 -727 157 -981 320 -64 41 -79 42 -119 10z"/>
        <path d="M1359 2575 c-248 -52 -437 -152 -595 -317 -67 -70 -99 -117 -156 -228 -38 -76 -47 -110 -27 -110 26 0 49 24 73 76 81 176 282 362 489 452 182 78 398 108 604 82 375 -46 684 -248 810 -528 34 -76 42 -85 59 -71 20 16 17 52 -8 107 -75 163 -192 284 -388 399 -253 149 -567 199 -861 138z"/>
        <path d="M1240 2252 c-34 -70 -89 -188 -122 -262 -63 -142 -81 -171 -97 -155 -6 6 -29 66 -53 134 -24 69 -48 126 -54 128 -5 2 -38 -54 -74 -125 l-65 -127 -95 -6 c-117 -7 -170 -31 -199 -93 -29 -61 -59 -222 -71 -387 -18 -240 14 -581 66 -705 26 -61 100 -171 157 -231 106 -113 141 -112 332 7 178 110 577 282 837 360 115 34 400 100 433 100 6 0 16 -4 24 -9 19 -12 -27 -68 -137 -163 -162 -141 -283 -223 -449 -305 -29 -14 -53 -29 -53 -34 0 -51 269 96 465 254 199 161 435 451 398 488 -19 19 -39 4 -78 -56 -53 -80 -90 -97 -295 -139 -433 -88 -813 -231 -1167 -440 -108 -63 -137 -76 -173 -76 -40 0 -48 5 -89 49 -88 93 -164 248 -185 377 -9 50 -3 56 89 78 467 114 757 221 872 321 60 52 132 162 140 212 5 32 4 35 -18 31 -17 -2 -33 -20 -56 -63 -47 -86 -132 -163 -234 -212 -187 -92 -773 -263 -801 -235 -35 35 -34 375 2 587 35 204 45 216 206 221 58 2 110 7 115 10 5 3 25 36 44 74 54 107 51 109 115 -80 23 -69 46 -129 51 -135 6 -5 16 9 26 35 54 136 202 445 214 445 19 0 26 -44 40 -244 9 -123 17 -175 26 -178 7 -3 59 22 115 56 56 34 107 61 115 61 21 0 16 -24 -27 -119 -22 -49 -40 -96 -40 -105 0 -14 20 -16 165 -16 195 0 192 1 225 -112 12 -40 37 -127 56 -193 20 -66 40 -133 46 -148 15 -38 39 -50 65 -32 27 19 41 80 128 582 27 156 52 263 65 277 14 14 49 -119 160 -599 12 -49 28 -100 36 -112 18 -28 59 -30 73 -4 6 10 30 94 55 187 64 242 80 289 96 289 8 0 26 -31 43 -75 45 -120 76 -143 214 -155 129 -12 193 6 177 50 -5 12 -29 15 -126 15 -162 0 -163 1 -222 142 -97 229 -114 216 -225 -185 -17 -59 -33 -112 -36 -118 -12 -19 -33 11 -45 64 -28 126 -144 597 -158 646 -19 62 -43 84 -66 61 -14 -14 -28 -79 -92 -425 -85 -463 -101 -514 -130 -420 -7 22 -27 87 -45 145 -17 58 -40 117 -51 132 -26 37 -72 49 -180 48 -127 -2 -125 -2 -131 15 -6 13 40 135 97 257 14 31 26 59 26 62 0 13 -24 4 -63 -22 -23 -16 -91 -57 -151 -92 -103 -59 -110 -62 -123 -44 -7 10 -13 32 -13 48 0 113 -38 504 -50 511 -4 2 -35 -53 -70 -123z"/>
        <path d="M600 1654 c-48 -124 -66 -574 -24 -574 11 0 14 26 14 138 0 121 14 250 46 425 5 30 4 37 -10 37 -9 0 -21 -12 -26 -26z"/>
        <path d="M2715 1431 c-3 -5 -21 -63 -41 -127 -118 -388 -359 -682 -755 -921 -125 -75 -293 -153 -329 -153 -33 0 -186 72 -312 147 -92 54 -111 62 -129 53 -11 -6 -19 -17 -16 -23 10 -32 270 -185 398 -236 l57 -22 76 31 c42 18 122 56 177 86 371 199 630 446 786 752 60 117 149 363 139 388 -7 18 -43 36 -51 25z"/>
        <path d="M805 785 c-38 -14 -112 -81 -101 -92 3 -3 19 6 36 20 41 35 95 49 143 37 48 -10 69 -29 92 -81 23 -50 51 -50 48 0 -4 82 -127 148 -218 116z"/>
      </g>
    </svg>
  );
}

/* ── Premium brand lockup ────────────────────────────────────── */
function Brand({ compact = false }) {
  return (
    <span className="flex items-center gap-3 group select-none">
      <span className="relative shrink-0">
        <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-red-500/40 via-red-500/10 to-emerald-500/40 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="relative w-10 h-10 rounded-2xl bg-black border border-white/15 flex items-center justify-center shadow-lg shadow-black/40 overflow-hidden">
          <span className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-emerald-500/10" />
          <CrashLogo className="h-6 w-6 relative" />
        </span>
      </span>
      <span className="leading-none">
        <span className="flex items-center gap-0.5 font-bold font-mono text-lg tracking-tight">
          <span className="text-gradient">C.R.A.S.H</span><span className="text-red-500">.</span>
        </span>
        {!compact && (
          <span className="hidden sm:block text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-mono mt-1 whitespace-nowrap">
            Critical Response Alert
          </span>
        )}
      </span>
    </span>
  );
}

/* ── Scroll reveal ───────────────────────────────────────────── */
function Reveal({ children, className = "", delay = 0, style, as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const d = delay >= 1 && delay <= 5 ? ` reveal-delay-${delay}` : "";
  return (
    <Tag ref={ref} style={style} className={`reveal ${visible ? "is-visible" : ""}${d} ${className}`}>
      {children}
    </Tag>
  );
}

/* ── Animated count-up ───────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "", decimals = 0, duration = 1600 }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf, start;
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const tick = (t) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [to, duration]);
  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("es-MX");
  return <span ref={ref} className="tabular-nums">{prefix}{display}{suffix}</span>;
}

/* ── Interactive impact simulator (innovative tool) ──────────── */
function ImpactSimulator() {
  const [g, setG] = useState(2);
  const { t } = useI18n();
  const tiers = [
    { min: 0, max: 3, key: "none", label: t("landing.tierNone", "Sin impacto"), color: "text-zinc-400", hex: "#71717a", ai: t("landing.tierNoneAi", "Sin fuerza significativa. El sistema permanece en modo vigilancia.") },
    { min: 3, max: 6, key: "mild", label: t("landing.tierMild", "Leve"), color: "text-emerald-400", hex: "#10b981", ai: t("landing.tierMildAi", "Golpe leve detectado. Se registra en la caja negra; sin alerta automática.") },
    { min: 6, max: 10, key: "moderate", label: t("landing.tierModerate", "Moderado"), color: "text-amber-400", hex: "#f59e0b", ai: t("landing.tierModerateAi", "Impacto moderado. Se notifica al conductor y se inicia cuenta regresiva de confirmación.") },
    { min: 10, max: 15, key: "severe", label: t("landing.tierSevere", "Severo"), color: "text-orange-400", hex: "#fb923c", ai: t("landing.tierSevereAi", "Triaje IA: posible traumatismo. Alerta a contactos y centro de control en 8s.") },
    { min: 15, max: 99, key: "critical", label: t("landing.tierCritical", "Crítico"), color: "text-red-500", hex: "#ef4444", ai: t("landing.tierCriticalAi", "Colisión crítica. Despliegue inmediato de emergencia con GPS y diagnóstico IA.") },
  ];
  const tier = tiers.find((t) => g >= t.min && g < t.max) || tiers[tiers.length - 1];
  const pct = Math.min(100, (g / 20) * 100);
  const etaMin = g >= 15 ? 4 : g >= 10 ? 8 : g >= 6 ? 20 : 45;
  const lesionPct = Math.min(98, Math.round(Math.pow(g, 1.7) * 1.4));

  return (
    <div className="card-premium p-6 sm:p-8 lg:p-10 relative overflow-hidden" style={{ borderRadius: 22 }}>
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-500/10 blur-[110px] pointer-events-none" />
      <div className="relative grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-red-400 text-xs font-mono uppercase tracking-[0.2em] mb-4">
            <Radar size={16} className="animate-spin-slow" /> {t("landing.demoInteractive", "Demostración interactiva")}
          </div>
          <h3 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-2">{t("landing.impactSimTitle", "Simulador de Impacto en vivo")}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            {t("landing.impactSimPara", "Arrastra para simular la fuerza-G de un impacto. La IA de C.R.A.S.H. clasifica la gravedad, estima la probabilidad de lesión y define el protocolo de respuesta en milisegundos.")}
          </p>

          <div className="flex items-center gap-4 mb-3">
            <Gauge size={22} className="text-white shrink-0" />
            <input
              type="range" min={0} max={20} step={0.5} value={g}
              onChange={(e) => setG(parseFloat(e.target.value))}
              className="w-full accent-red-500 h-2 rounded-full bg-white/10 appearance-none cursor-pointer"
              aria-label={t("landing.impactGLabel", "Fuerza G del impacto")}
            />
          </div>
          <div className="flex items-end justify-between mb-6">
            <div className="font-mono">
              <span className="text-4xl font-bold">{g.toFixed(1)}</span>
              <span className="text-zinc-500 text-sm ml-1">G</span>
            </div>
            <div className={`font-bold text-lg font-mono ${tier.color}`}>{tier.label}</div>
          </div>

          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-6">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: tier.hex, boxShadow: `0 0 16px ${tier.hex}66` }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t("landing.probLesion", "Prob. de lesión")}</div>
              <div className="font-mono font-bold text-lg" style={{ color: tier.hex }}>{lesionPct}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t("landing.respEstimate", "Respuesta estimada")}</div>
              <div className="font-mono font-bold text-lg">{etaMin}s</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`relative w-44 h-44 rounded-full flex items-center justify-center ${g >= 10 ? "live-ring" : ""}`}>
            <div
              className={g >= 10 ? "helmet-shake" : ""}
              key={g >= 10 ? Math.round(g) : "idle"}
              style={{ color: tier.hex }}
            >
              <CrashLogo className="h-28 w-28" />
            </div>
          </div>
          <div className={`rounded-xl border px-4 py-3 text-sm text-center max-w-xs ${tier.key === "critical" ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}>
            <Brain size={15} className="inline mr-1.5 -mt-0.5" />
            {tier.ai}
          </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const [plans, setPlans] = useState([]);
  const [cycle, setCycle] = useState("Mensual");
  const [audience, setAudience] = useState("b2c");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [appVersion, setAppVersion] = useState(null);
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/plans"); setPlans(data || []); } catch { setPlans([]); }
    })();
    (async () => {
      try { const { data } = await api.get("/versions/latest", { params: { platform: "android" } }); if (data?.download_url) setAppVersion(data); } catch {}
    })();
  }, []);

  // Bloquea el scroll del fondo mientras el carrito está abierto.
  useEffect(() => {
    if (!cartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [cartOpen]);

  const deviceB2B = plans[0]?.device_b2b || B2B_DEVICE;
  const deviceB2C = plans[0]?.device_b2c || B2C_DEVICE;
  const subB2BPerDriver = plans[0]?.sub_b2b || B2B_SUB_PER_DRIVER;
  const subB2C = plans[0]?.sub_b2c || B2C_SUB;

  const priceOfItem = (item) => {
    if (item.kind === "device") return item.audience === "b2b" ? deviceB2B : deviceB2C;
    if (item.kind === "b2csub") return Math.round(subB2C * (CYCLE_MULT[item.cycle] || 1));
    if (item.kind === "plan") {
      const p = plans.find((x) => x.name === item.planName);
      return p ? Math.round((p.price || 0) * (CYCLE_MULT[item.cycle] || 1)) : 0;
    }
    return item.price || 0;
  };

  const labelOf = (item) => {
    if (item.kind === "device") return t(item.audience === "b2b" ? "landing.cartKitB2b" : "landing.cartKitB2c", item.audience === "b2b" ? "Kit C.R.A.S.H. (Empresa)" : "Kit C.R.A.S.H. (Usuario)");
    if (item.kind === "b2csub") return t("landing.cartSubApp", "Suscripción App ({c})").replace("{c}", t(`landing.cycle${item.cycle}`, item.cycle));
    if (item.kind === "plan") return t("landing.cartPlan", "Plan {p} ({c})").replace("{p}", item.planName).replace("{c}", t(`landing.cycle${item.cycle}`, item.cycle));
    return item.name || t("landing.cartProduct", "Producto");
  };

  const addItems = (items) => {
    setCart((c) => {
      let next = c;
      items.forEach((it) => { next = [...next.filter((x) => x.key !== it.key), it]; });
      return next;
    });
    setCartOpen(true);
  };

  const removeFromCart = (key) => setCart((c) => c.filter((x) => x.key !== key));
  const total = cart.reduce((s, i) => s + priceOfItem(i), 0);

  const buildMessage = () => {
    let msg = t("landing.cartMsg", "Hola, quiero contratar C.R.A.S.H.:") + "%0A%0A";
    cart.forEach((i) => { msg += `• ${labelOf(i)}: ${mx(priceOfItem(i)).replace(/ /g, "%20")}%0A`; });
    msg += `%0A${t("landing.cartTotalMsg", "TOTAL:")} ${mx(total).replace(/ /g, "%20")}`;
    return msg;
  };
  const orderWhatsApp = () => {
    if (!cart.length) return;
    window.open(`https://wa.me/${CONTACT_WHATSAPP}?text=${buildMessage()}`, "_blank");
  };
  const orderEmail = () => {
    if (!cart.length) return;
    const body = buildMessage().replace(/%0A/g, "\n").replace(/%20/g, " ");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t("landing.cartOrderSubject", "Pedido C.R.A.S.H."))}&body=${encodeURIComponent(body)}`;
  };

  const TRUST = [
    { key: "trustAI", label: "IA de Triaje" },
    { key: "trustWhatsapp", label: "WhatsApp Business" },
    { key: "trustWebsockets", label: "WebSockets en vivo" },
    { key: "trustBlackbox", label: "Caja Negra IMU" },
    { key: "trustGeofence", label: "Geocercas" },
    { key: "trustNom115", label: "NOM-115" },
    { key: "trustIso", label: "ISO 45001" },
    { key: "trustOffline", label: "Modo Offline" },
  ];

  return (
    <div className="page-enter bg-[#050505] text-white min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] grid-pan" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-red-500/10 blur-[120px] orb-float" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] orb-float-2" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <Brand />
            </Link>
            <div className="flex items-center gap-4">
              <a href="#planes" className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors font-medium">{t("landing.navPlanes", "Planes")}</a>
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-zinc-300 hover:text-white transition-colors"
                aria-label={t("landing.cartOpenAria", "Abrir carrito")}
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-mono font-bold">
                    {cart.length}
                  </span>
                )}
              </button>
              <Link
                to="/login"
                className="text-sm bg-white text-black font-bold px-4 py-2 rounded-xl hover:bg-zinc-200 transition-all hover:-translate-y-0.5 shadow-lg shadow-white/10"
              >
                {t("landing.navAccess", "Acceso monitoristas")}
              </Link>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={HERO} alt={t("landing.heroAlt", "Motociclista de noche")} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/78" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,#050505)" }} />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-40">
            <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-mono text-zinc-300 mb-6 fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-safe" />
              {t("landing.heroBadge", "Ecosistema de cascos · Monitoreo en vivo")}
            </div>
            <h1 className="font-bold font-mono text-4xl sm:text-5xl lg:text-6xl tracking-tight max-w-3xl leading-[1.05] fade-up" style={{ animationDelay: "0.1s" }}>
              {t("landing.heroTitle", "Alerta crítica que previene y responde al accidente en tiempo real.")}
            </h1>
            <p className="text-zinc-300 text-base md:text-lg mt-6 max-w-xl fade-up" style={{ animationDelay: "0.2s" }}>
              {t("landing.heroSub", "C.R.A.S.H. (Critical Response Alert System for Helmets) detecta impactos en el casco, analiza la gravedad con IA y alerta de inmediato con ubicación a tus contactos y al centro de monitoreo.")}
            </p>
            <div className="flex flex-wrap gap-3 mt-8 fade-up" style={{ animationDelay: "0.3s" }}>
              <a href="#planes" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-white/10">
                {t("landing.heroCtaPlans", "Ver planes")} <ArrowRight size={18} />
              </a>
              <Link to="/login" className="border border-white/20 hover:border-white/50 font-bold px-6 py-3 rounded-xl transition-all">
                {t("landing.heroCtaControl", "Centro de control")}
              </Link>
              {appVersion && (
                <a href={appVersion.download_url} target="_blank" rel="noreferrer" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  <Download size={18} /> {t("landing.heroDownload", "Descargar app")} <span className="font-mono text-xs opacity-70">v{appVersion.version}</span>
                </a>
              )}
            </div>

            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl fade-up" style={{ animationDelay: "0.4s" }}>
              {[
                { icon: Activity, v: 20, suffix: "ms", l: "Detección" },
                { icon: Zap, v: 99, suffix: "%", l: "Precisión IA" },
                { icon: Users, v: 386000, l: "Usuarios moto" },
                { icon: ShieldAlert, v: 61869, l: "Accidentes/año" },
              ].map((s, i) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm px-4 py-3">
                  <div className="font-mono font-bold text-2xl"><Counter to={s.v} suffix={s.suffix || ""} /></div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 uppercase tracking-wide">{t(`landing.stat${i}`, s.l)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center pb-8 pointer-events-none">
            <ChevronDown size={26} className="text-zinc-500 animate-bounce" />
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee-mask overflow-hidden border-y border-white/[0.04] py-4 bg-white/[0.015]">
          <div className="marquee-track">
            {[...TRUST, ...TRUST].map((it, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-6 text-sm text-zinc-500 font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" /> {t(`landing.${it.key}`, it.label)}
              </span>
            ))}
          </div>
        </div>

        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <Reveal>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrow3Components", "Los 3 componentes")}</div>
            <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-10">{t("landing.titleEcosystem", "Un ecosistema sincronizado")}</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {HERO_SUB.map((c, i) => (
              <Reveal key={c.key} delay={(i % 3) + 1} className="card-premium p-8 hover-lift" style={{ borderRadius: 20 }}>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <c.icon size={26} className="text-white" />
                </div>
                <div className="font-bold font-mono text-lg">{t(`landing.${c.key}`, c.t)}</div>
                <div className="text-red-500 text-xs font-mono uppercase tracking-wider mb-3 mt-1">{t(`landing.${c.key}Sub`, c.s)}</div>
                <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${c.key}Desc`, c.d)}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <Reveal>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowFeatures", "Características")}</div>
            <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-10">{t("landing.titleProtection", "Protección en cada kilómetro")}</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.key} delay={(i % 3) + 1} className="card-premium p-6 hover-lift" style={{ borderRadius: 16 }}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-emerald-400" />
                </div>
                <div className="font-bold mb-1.5 text-[15px]">{t(`landing.${f.key}`, f.t)}</div>
                <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${f.key}Desc`, f.d)}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* INNOVATIVE TOOL: impact simulator */}
        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <Reveal className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowAI", "Inteligencia Artificial")}</Reveal>
          <Reveal delay={1} className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-8">{t("landing.titleBrain", "Prueba el cerebro de C.R.A.S.H.")}</Reveal>
          <Reveal delay={2}>
            <ImpactSimulator />
          </Reveal>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <Reveal className="card-premium p-8 lg:p-12 relative overflow-hidden hover-lift" style={{ borderRadius: 20 }}>
            <Network size={160} className="absolute -right-8 -bottom-8 text-emerald-500/10" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-[0.2em] mb-4">
                <Network size={16} /> {t("landing.eyebrowCityFactor", "Factor Ciudad")}
              </div>
              <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight max-w-2xl">{t("landing.titleGeofence", "Módulo de Geocercas de Riesgo")}</h2>
              <p className="text-zinc-400 mt-4 max-w-2xl leading-relaxed">
                {t("landing.geoParaA", "Al entrar a zonas de alto riesgo (curvas peligrosas, túneles o escolares), se activa una geocerca de ")}<b className="text-white">{t("landing.geoModeCaution", "Precaución")}</b>{t("landing.geoParaB", ": cronometra el tiempo exacto en la zona, pausa alertas por detención y mide la fuerza-G para anticipar caídas.")}
              </p>
              <div className="flex flex-wrap gap-6 mt-6">
                {[
                  { icon: MapPin, label: "Geocercas", value: "Curvas, túneles, escolares" },
                  { icon: History, label: "Monitoreo", value: "Tiempo exacto en zona" },
                  { icon: Signal, label: "Alertas", value: "Pausa automática" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3 text-sm">
                    <s.icon size={18} className="text-emerald-400" />
                    <div>
                      <div className="text-zinc-500 text-xs">{t(`landing.geoLabel${i}`, s.label)}</div>
                      <div className="text-white font-semibold">{t(`landing.geoVal${i}`, s.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <Reveal className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowDemo", "Demo en vivo")}</Reveal>
          <Reveal delay={1} className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-8">{t("landing.titleAction", "Vélo en acción")}</Reveal>
          <Reveal delay={2} className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video card-premium" style={{ borderRadius: 20 }}>
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              preload="auto"
              poster={HERO}
              src="/videos/CrashVideo.mp4"
            >
              {t("landing.videoFallback", "Tu navegador no soporta el elemento de video.")}
            </video>
          </Reveal>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <Reveal className="card-premium p-8 lg:p-12 relative overflow-hidden" style={{ borderRadius: 20 }}>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-red-500/10 blur-[100px]" />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-red-400 mb-3 font-mono">{t("landing.eyebrowProject", "El Proyecto C.R.A.S.H.")}</div>
              <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-3">{t("landing.titleMemory", "Memoria del proyecto · InnovaTecNM 2026")}</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">{t("landing.projDesc", PROJECT_META.descripcion)}</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-8">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelEvento", "Evento")}</div><div className="font-medium">{t("landing.projEvento", PROJECT_META.evento)}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelSede", "Sede")}</div><div className="font-medium">{t("landing.projSede", PROJECT_META.sede)}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelFolioCat", "Folio · Categoría")}</div><div className="font-medium">{PROJECT_META.folio} · {t("landing.projCategoria", PROJECT_META.categoria)}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelArea", "Área")}</div><div className="font-medium">{t("landing.projArea", PROJECT_META.area)}</div></div>
              </div>

              <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowProblem", "Problemática")}</div>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {PROBLEMS.map((p) => (
                  <div key={p.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="font-bold text-[15px] mb-1.5 text-red-300">{t(`landing.${p.key}`, p.t)}</div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${p.key}Desc`, p.d)}</p>
                  </div>
                ))}
              </div>

              <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowValue", "Propuesta de valor")}</div>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {VALUE.map((v) => (
                  <div key={v.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="font-bold text-[15px] mb-1.5 text-emerald-300">{t(`landing.${v.key}`, v.t)}</div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${v.key}Desc`, v.d)}</p>
                  </div>
                ))}
              </div>

              <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowArch", "Arquitectura técnica")}</div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {ARCH.map((a) => (
                  <div key={a.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="font-bold text-[15px] mb-1.5">{t(`landing.${a.key}`, a.t)}</div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${a.key}Desc`, a.d)}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowTeam", "Equipo · Autores")}</div>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    {TEAM.map((m) => (
                      <li key={m} className="flex items-start gap-2"><Users size={14} className="text-emerald-400 mt-1 shrink-0" /><span>{m}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowAdvisors", "Asesores")}</div>
                  <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                    {ADVISORS.map((a) => (
                      <li key={a} className="flex items-start gap-2"><Building2 size={14} className="text-red-400 mt-1 shrink-0" /><span>{a}</span></li>
                    ))}
                  </ul>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowNorms", "Normatividad aplicable")}</div>
                  <div className="space-y-2">
                    {NORMS.map((n) => (
                      <div key={n.c} className="text-sm"><span className="font-mono font-bold text-white">{n.c}</span><span className="text-zinc-400"> — {t(`landing.${n.key}`, n.d)}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="planes" className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <Reveal>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowSubs", "Suscripciones")}</div>
            <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-2">{t("landing.titlePlans", "Planes y precios")}</h2>
            <p className="text-zinc-400 mb-6 text-sm max-w-2xl">
              {t("landing.planesIntro", "El precio a empresas (B2B) es superior al del usuario final (B2C) porque incluye dashboard corporativo, telemetría de flotilla e instalación. Elige tu perfil para ver precios en MXN.")}
            </p>
          </Reveal>

          <div className="inline-flex gap-1 border border-white/10 rounded-xl p-1 mb-6 bg-white/[0.02]">
            <button
              onClick={() => setAudience("b2c")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${audience === "b2c" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              <Users size={15} /> {t("landing.audienceB2c", "Usuario (B2C)")}
            </button>
            <button
              onClick={() => setAudience("b2b")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${audience === "b2b" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              <Building2 size={15} /> {t("landing.audienceB2b", "Empresa (B2B)")}
            </button>
          </div>

          {audience === "b2c" ? (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="card-premium p-6 flex flex-col hover-lift" style={{ borderRadius: 20 }}>
                <div className="font-bold font-mono text-2xl">{t("landing.planPersonal", "Plan Personal")}</div>
                <div className="text-zinc-500 text-sm mt-1">{t("landing.planPersonalDesc", "Protección para motociclistas particulares y repartidores independientes.")}</div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-mono font-bold text-4xl">{mx(subB2C)}</span>
                  <span className="text-zinc-500 text-sm mb-1 font-mono">/ {cycle.toLowerCase()}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm flex-1">
                  {[
                    "Monitoreo en vivo con IA",
                    "Alertas de impacto a contactos",
                    "Historial de telemetría",
                    "App móvil C.R.A.S.H.",
                    "Dispositivo con 46% de margen",
                  ].map((f, i) => (
                    <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                      <Check size={15} className="text-emerald-400 shrink-0" /> {t(`landing.b2cFeat${i + 1}`, f)}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  <button
                    onClick={() => addItems([{ key: `b2c-device`, kind: "device", audience: "b2c" }])}
                    className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-xl transition-all hover:bg-white/5 text-sm"
                  >
                    {t("landing.btnDevice", "Dispositivo")} {mx(deviceB2C)}
                  </button>
                  <button
                    onClick={() => addItems([{ key: `b2c-sub-${cycle}`, kind: "b2csub", cycle }])}
                    className="bg-white text-black font-bold py-3 rounded-xl transition-all hover:bg-zinc-200 text-sm"
                  >
                    {t("landing.btnSubscription", "Suscripción")}
                  </button>
                </div>
              </div>

              <div className="card-premium p-6 flex flex-col justify-center hover-lift" style={{ borderRadius: 20 }}>
                <div className="text-emerald-400 text-xs font-mono uppercase tracking-[0.2em] mb-3">{t("landing.whyCrash", "¿Por qué C.R.A.S.H.?")}</div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {t("landing.whyPara", "En 2024 se registraron 61,869 accidentes con motocicleta en México. Más de 386 mil personas usan la moto como herramienta de trabajo.")}
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">{t("landing.priceDeviceB2c", "Dispositivo (B2C)")}</span>
                    <span className="font-mono font-bold">{mx(deviceB2C)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">{t("landing.priceSubMonth", "Suscripción / mes")}</span>
                    <span className="font-mono font-bold">{mx(subB2C)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t("landing.priceProduction", "Costo de producción")}</span>
                    <span className="font-mono font-bold text-emerald-400">$800 MXN</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex flex-wrap gap-1 border border-white/10 rounded-xl p-1 mb-8 bg-white/[0.02]">
                {CYCLES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCycle(c.label)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${cycle === c.label ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    {t(`landing.${c.key}`, c.label)}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {plans.map((p) => (
                  <div
                    key={p.name}
                    className={`card-premium p-6 flex flex-col transition-all duration-300 hover-lift ${p.popular ? "border-white/20 ring-1 ring-white/10 scale-[1.02] shimmer-border" : ""}`}
                    style={{ borderRadius: 20 }}
                  >
                    {p.popular && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3 bg-emerald-500/10 px-2.5 py-1 rounded-full self-start">
                        <Check size={10} /> {t("landing.popular", "Más popular")}
                      </div>
                    )}
                    <div className="font-bold font-mono text-2xl">{p.name}</div>
                    <div className="text-zinc-500 text-sm mt-1">{t("landing.planDrivers", "Hasta {d} repartidores · {m} monitores").replace("{d}", p.max_drivers).replace("{m}", p.max_monitors)}</div>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="font-mono font-bold text-4xl">{mx(Math.round((p.price || 0) * (CYCLE_MULT[cycle] || 1)))}</span>
                      <span className="text-zinc-500 text-sm mb-1 font-mono">{t(`landing.cycleSlash${cycle}`, `/ ${cycle.toLowerCase()}`)}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">{t("landing.planIncludesSaas", "Incluye SaaS a {amt} por repartidor/mes").replace("{amt}", mx(subB2BPerDriver))}</div>
                    <ul className="mt-6 space-y-3 text-sm flex-1">
                       {(p.features && p.features.length ? p.features : ["Monitoreo en tiempo real", "Alertas de impacto", "Historial de telemetría", "Soporte"]).map((f, i) => (
                         <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                           <Check size={15} className="text-emerald-400 shrink-0" />
                           {p.features && p.features.length ? f : t(`landing.b2bDefFeat${i}`, f)}
                         </li>
                       ))}
                    </ul>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button
                        onClick={() => addItems([{ key: `b2b-device`, kind: "device", audience: "b2b" }])}
                        className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-xl transition-all hover:bg-white/5 text-sm"
                      >
                         {t("landing.btnDisp", "Disp.")} {mx(deviceB2B)}
                      </button>
                      <button
                        onClick={() => addItems([{ key: `plan-${p.name}-b2b-${cycle}`, kind: "plan", planName: p.name, cycle }])}
                        className={`font-bold py-3 rounded-xl transition-all text-sm ${p.popular ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10" : "border border-white/15 hover:border-white/40 hover:bg-white/5"}`}
                      >
                    {t("landing.btnSubscription", "Suscripción")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-xs text-zinc-600 mt-8 leading-relaxed max-w-2xl">
            {t("landing.plansFooter", "El precio B2B (empresa) es superior al B2C porque suma instalación, soporte, dashboard corporativo con telemetría de flotilla y prevención de accidentes laborales. Las empresas acceden a un Centro de Control que reduce primas de seguro y responsabilidad civil.")}
          </p>
        </section>

        <footer className="border-t border-white/[0.04] py-12 text-center">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brand compact />
            </div>
            <p className="text-zinc-600 text-sm font-mono">
              {t("landing.footerTag", "Critical Response Alert System for Helmets · Hecho en México")}
            </p>
          </div>
        </footer>
      </div>

      {cartOpen && createPortal((
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-in" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.6)] animate-scale-in overflow-hidden">
            <div className="px-5 h-16 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
              <span className="font-bold font-mono flex items-center gap-2 text-base">
                <ShoppingCart size={18} /> {t("landing.cartTitle", "Carrito")} {cart.length > 0 && <span className="text-xs text-zinc-500">({cart.length})</span>}
              </span>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all" aria-label={t("landing.cartCloseAria", "Cerrar carrito")}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                  <ShoppingCart size={32} className="text-zinc-700" />
                  <p className="text-zinc-600 text-sm">{t("landing.cartEmpty", "Tu carrito está vacío.")}</p>
                  <p className="text-zinc-700 text-xs">{t("landing.cartAdd", "Agrega un plan para comenzar.")}</p>
                </div>
              )}
              {cart.map((i) => (
                <div key={i.key} className="card-premium p-3.5 flex items-center justify-between gap-3" style={{ borderRadius: 12 }}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{labelOf(i)}</div>
                    <div className="font-mono text-zinc-400 text-sm mt-0.5">{mx(priceOfItem(i))}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(i.key)}
                    className="w-7 h-7 shrink-0 rounded-md border border-white/10 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                    aria-label="Quitar del carrito"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/[0.06] space-y-3 bg-black/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm uppercase tracking-wider font-mono">{t("landing.cartTotal", "Total")}</span>
                <span className="font-mono font-bold text-2xl">{mx(total)}</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {t("landing.cartInfo", "Recibe la información del plan por WhatsApp o correo. La compra es simulada: al confirmar generamos tus tokens.")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={orderWhatsApp} className="bg-emerald-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <MessageCircle size={20} /> {t("landing.cartWhatsapp", "WhatsApp")}
                </button>
                <button onClick={orderEmail} className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/5">
                  <Mail size={20} /> {t("landing.cartEmail", "Correo")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

export default memo(Landing);
