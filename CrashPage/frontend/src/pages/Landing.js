import { memo, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate,
  AnimatePresence, useReducedMotion,
} from "framer-motion";
import {
  Smartphone, Cpu, Monitor,
  MessagesSquare, Database, ShoppingCart, X, MessageCircle, Mail,
  Check, ArrowRight, MapPin, History, Signal, Users, Building2,
  Gauge, Brain, ShieldAlert, Zap, Activity, Radar, ChevronDown, Download,
  Crosshair, Radio, Network, LocateFixed,
} from "lucide-react";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

const CONTACT_WHATSAPP = "528674718298";
const CONTACT_EMAIL = "leija901123@gmail.com";
const CYCLES = [
  { key: "cycleSemanal", label: "Semanal" },
  { key: "cycleMensual", label: "Mensual" },
  { key: "cycleBimestral", label: "Bimestral" },
  { key: "cycleTrimestral", label: "Trimestral" },
  { key: "cycleAnual", label: "Anual" },
];
const CYCLE_MULT = { Semanal: 0.3, Mensual: 1, Bimestral: 1.9, Trimestral: 2.7, Anual: 9.6 };
const HERO = "https://images.pexels.com/photos/2611685/pexels-photo-2611685.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const B2C_DEVICE = 1499;
const B2C_SUB = 49;
const B2B_DEVICE = 1999;
const B2B_SUB_PER_DRIVER = 150;

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
  { key: "heroMobile", icon: Smartphone, t: "App Móvil", s: "El Escudo del Conductor", d: "Cero distracciones en marcha, caja negra offline y botón de pánico silencioso en el casco.", tag: "CLIENTE · ANDROID" },
  { key: "heroBackend", icon: Cpu, t: "Backend / Dispositivo", s: "El Cerebro", d: "Arduino Nano + MPU-6050 detecta impactos en milisegundos, con filtro de acelerómetro e IA de gravedad.", tag: "SENSOR · MEMS" },
  { key: "heroDashboard", icon: Monitor, t: "Dashboard Web", s: "Centro de Monitoreo", d: "WebSockets en vivo, gestión por excepción y difusión automática a contactos y autoridades.", tag: "STREAM · WEBSOCKET" },
];

const FEATURES = [
  { key: "featureAI", icon: Cpu, t: "Detección de impacto por IA", d: "El módulo MPU-6050 con red neuronal de clasificación detecta la fuerza-G del impacto y categoriza la gravedad en milisegundos." },
  { key: "featureTriage", icon: Brain, t: "Triaje automatizado", d: "La IA discrimina entre un golpe leve y una colisión crítica, estimando la probabilidad de lesión para priorizar la respuesta médica." },
  { key: "featureAlerts", icon: MessagesSquare, t: "Alertas automáticas a contactos", d: "WhatsApp Business difunde ubicación GPS y diagnóstico del impacto a tus contactos y al centro de monitoreo de inmediato." },
  { key: "featureLive", icon: Monitor, t: "Monitoreo en vivo", d: "Centro de Control con WebSockets muestra la flotilla, telemetría y estado de cada conductor en tiempo real." },
  { key: "featureGeofence", icon: MapPin, t: "Geocercas de riesgo", d: "Zonas peligrosas (curvas, túneles, escolares) activan modo Precaución y cronometran el tiempo exacto en la zona." },
  { key: "featureBlackbox", icon: Database, t: "Caja Negra del Casco", d: "Almacena telemetría IMU local y la envía en ráfaga al recuperar la señal en zonas muertas, sin perder datos." },
];

/* ── Ease functions ──────────────────────────────────────────────── */
const easeGentle = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };

/* ── SVG CrashLogo (bolt) ──────────────────────────────────────────── */
function CrashLogoSvg({ className = "h-9 w-9", style }) {
  return (
    <svg viewBox="0 0 333 306" className={`${className} text-red-500`} style={style} aria-hidden="true">
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

/* ── Premium brand lockup ─────────────────────────────────────────── */
function Brand({ compact = false }) {
  return (
    <motion.span className="flex items-center gap-3 group select-none" whileHover="hover" initial="initial">
      <motion.span className="relative shrink-0"
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.08, transition: { type: "spring", stiffness: 400, damping: 10 } },
        }}
      >
        <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-red-500/40 via-red-500/10 to-red-500/40 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="relative w-10 h-10 rounded-2xl bg-black border border-white/15 flex items-center justify-center shadow-lg shadow-black/40 overflow-hidden">
          <span className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-500/10" />
          <CrashLogoSvg className="h-6 w-6 relative" />
        </span>
      </motion.span>
      <span className="leading-none">
        <span className="flex items-center gap-0.5 font-bold font-mono text-lg tracking-tight">
          <span className="shimmer-brand">C.R.A.S.H</span><span className="text-red-500">.</span>
        </span>
        {!compact && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:block text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-mono mt-1 whitespace-nowrap"
          >
            Critical Response Alert
          </motion.span>
        )}
      </span>
    </motion.span>
  );
}

/* ── Barra de progreso de scroll ───────────────────────────────────── */
function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="progress-scan fixed top-0 left-0 right-0 h-[2px] origin-left z-[70] bg-gradient-to-r from-red-600 via-red-400 to-red-600"
      style={{ scaleX }}
    />
  );
}

/* ── Spotlight que sigue al cursor (solo pointer fino) ─────────────── */
function CursorSpotlight() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-700);
  const y = useMotionValue(-700);
  const sx = useSpring(x, { stiffness: 90, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 90, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [reduce, x, y]);

  const background = useMotionTemplate`radial-gradient(620px at ${sx}px ${sy}px, rgba(239,68,68,0.06), transparent 70%)`;
  if (reduce) return null;
  return <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-[3] hidden lg:block" style={{ background }} />;
}

/* ── Grano de película ─────────────────────────────────────────────── */
function Grain() {
  return <div aria-hidden className="grain-overlay" />;
}

/* ── Botón magnético (física de hover) ─────────────────────────────── */
function Magnetic({ children, className = "", strength = 0.16, style = {} }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 15 });
  const sy = useSpring(my, { stiffness: 150, damping: 15 });
  const transform = useTransform([sx, sy], ([vx, vy]) => `translate3d(${vx}px, ${vy}px, 0)`);

  const handleMove = useCallback((e) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  }, [reduce, strength, mx, my]);

  const handleLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{ transform, ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ── Particle canvas background ─────────────────────────────────── */
function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w, h;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 55;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      a: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > cw) p.vx *= -1;
        if (p.y < 0 || p.y > ch) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${p.a})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(239,68,68,${0.08 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* ── 3D Tilt Card ─────────────────────────────────────────────────── */
function TiltCard({ children, className = "", style = {}, onMouseMove }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouse = useCallback((e) => {
    onMouseMove?.(e);
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setTilt({ x: y * -6, y: x * 6 });
  }, [onMouseMove]);

  const handleLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={className}
      style={{ perspective: "800px", ...style }}
    >
      <motion.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── Framer scroll reveal (con blur cinemático) ───────────────────── */
function ScrollReveal({ children, className = "", delay = 0, y = 40 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.7, delay: delay * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Spring counter ──────────────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "", decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    let start, raf;
    const duration = 1600;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [to, hasAnimated]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("es-MX");
  return <span ref={ref} className="tabular-nums">{prefix}{display}{suffix}</span>;
}

/* ── Chip de telemetría flotante (hero) ────────────────────────────── */
function HeroChip({ className = "", anim = "chip-float", label, value, unit = "", hint, delay = "0s" }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="glass-refined hud-frame rounded-xl px-4 py-3" style={{ animation: `${anim} 7s ease-in-out ${delay} infinite` }}>
        <div className="hud-ticker text-neutral-500 flex items-center gap-2">
          <span className="glow-dot bg-red-500 text-red-500" />{label}
        </div>
        <div className="font-mono font-bold text-lg mt-1">
          {value}<span className="text-neutral-500 text-xs ml-1">{unit}</span>
        </div>
        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{hint}</div>
      </div>
    </div>
  );
}

/* ── Sección "Cabina": historia pinned al scroll ───────────────────── */
function CockpitSection({ t }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const op0 = useTransform(scrollYProgress, [0, 0.28, 0.36], [1, 1, 0]);
  const op1 = useTransform(scrollYProgress, [0.3, 0.6, 0.68], [0, 1, 0]);
  const op2 = useTransform(scrollYProgress, [0.62, 0.9], [0, 1]);

  const steps = [
    {
      n: "01",
      tag: t("landing.cockpitTag1", "SENSOR · MPU-6050"),
      title: t("landing.cockpitTitle1", "Detección"),
      text: t("landing.cockpitText1", "El nodo sensor captura la curva de fuerza-G en milisegundos y la transmite por Bluetooth al teléfono del conductor."),
    },
    {
      n: "02",
      tag: t("landing.cockpitTag2", "RED NEURONAL · FASTAPI"),
      title: t("landing.cockpitTitle2", "Triaje IA"),
      text: t("landing.cockpitText2", "La red neuronal clasifica la gravedad y estima la probabilidad de lesión antes de decidir el protocolo de respuesta."),
    },
    {
      n: "03",
      tag: t("landing.cockpitTag3", "ALERTA · OMNICANAL"),
      title: t("landing.cockpitTitle3", "Despliegue"),
      text: t("landing.cockpitText3", "Alertas a WhatsApp Business, contactos de emergencia y centro de control con GPS exacto del incidente."),
    },
  ];

  const opacities = [op0, op1, op2];

  const visuals = [
    (
      <div key="v0" className="relative w-64 h-64 sm:w-72 sm:h-72">
        <div className="radar-sweep absolute inset-0 rounded-full bg-[#0a0a0a] border border-white/10" />
        <div className="absolute inset-9 rounded-full border border-white/5" />
        <div className="absolute rounded-full border border-white/5" style={{ inset: "4.5rem" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)]" />
        </div>
        <span className="absolute top-0 -right-2 hud-ticker text-neutral-600">AZ 214° · EL 12°</span>
        <span className="absolute bottom-0 -left-2 hud-ticker text-neutral-600">RANGO 8m</span>
      </div>
    ),
    (
      <div key="v1" className="double-bezel rounded-3xl w-full max-w-sm">
        <div className="glass-refined rounded-[calc(1.5rem-2px)] p-8">
          <div className="hud-ticker text-neutral-500 mb-6 flex items-center justify-between">
            <span>FORMA DE ONDA</span><span className="text-red-400">ANALIZANDO</span>
          </div>
          <div className="wave-bars h-20">
            {Array.from({ length: 26 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 9) * 0.09}s`, height: `${20 + ((i * 37) % 62)}px` }} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="hud-ticker text-neutral-500">SEVERIDAD</span>
            <span className="hud-ticker text-red-400 border border-red-500/40 bg-red-500/10 rounded-md px-2.5 py-1">CRÍTICA</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
              initial={{ width: "12%" }} animate={{ width: "78%" }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <div className="mt-2 hud-ticker text-neutral-600">LESIÓN ESTIMADA <span className="text-white">78%</span></div>
        </div>
      </div>
    ),
    (
      <div key="v2" className="relative w-72 h-64 sm:w-80">
        <div className="absolute left-1/2 top-4 -translate-x-1/2">
          <span className="pulse-ring w-44 h-44" />
          <span className="pulse-ring w-44 h-44" style={{ animationDelay: "0.9s" }} />
          <span className="pulse-ring w-44 h-44" style={{ animationDelay: "1.8s" }} />
          <div className="relative h-14 w-14 rounded-full bg-red-500/15 border border-red-500/50 flex items-center justify-center backdrop-blur-sm">
            <MapPin className="h-6 w-6 text-red-400" />
          </div>
        </div>
        <div className="absolute bottom-2 left-0 glass-refined hud-frame rounded-lg px-3 py-2 max-w-[200px]">
          <div className="hud-ticker text-neutral-500">SMS + WHATSAPP</div>
          <div className="text-xs font-mono mt-0.5 text-white">IMPACTO CRÍTICO · 6.2G</div>
        </div>
        <div className="absolute bottom-14 right-0 glass-refined hud-frame rounded-lg px-3 py-2 max-w-[180px]">
          <div className="hud-ticker text-neutral-500 flex items-center gap-1.5"><LocateFixed className="h-3 w-3 text-red-400" />GPS</div>
          <div className="text-xs font-mono mt-0.5">27.48°N · 99.50°W</div>
        </div>
      </div>
    ),
  ];

  const textPanels = steps.map((s, i) => (
    <motion.div key={s.n} className="absolute inset-0 flex flex-col justify-center" style={{ opacity: opacities[i] }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="tactical-index text-lg">{s.n} / 03</span>
        <span className="h-px flex-1 bg-gradient-to-r from-red-500/40 to-transparent" />
      </div>
      <div className="hud-ticker text-red-400 mb-3">{s.tag}</div>
      <h3 className="font-bold font-mono text-4xl sm:text-5xl tracking-tight mb-4">{s.title}</h3>
      <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md">{s.text}</p>
      <div className="mt-8 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-xs">
        <motion.div className="h-full bg-gradient-to-r from-red-600 via-red-400 to-orange-300 rounded-full"
          style={{ width: `${(i + 1) * 33}%` }} transition={{ duration: 0.6 }} />
      </div>
    </motion.div>
  ));

  if (reduce) {
    return (
      <section id="cockpit" className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1 relative h-[340px] flex justify-center">{visuals[0]}</div>
          <div className="order-1 lg:order-2 relative h-[340px]">{textPanels[0]}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="cockpit" ref={ref} className="relative h-[340vh]">
      <div className="sticky top-0 h-[100dvh] flex items-center justify-center px-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30 scanlines" />
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div className="relative h-[320px] sm:h-[380px] lg:h-[460px]">
            {visuals.map((v, i) => (
              <motion.div key={v.key} className="absolute inset-0 flex items-center justify-center" style={{ opacity: opacities[i], pointerEvents: "none" }}>
                {v}
              </motion.div>
            ))}
          </div>
          <div className="relative h-[300px] sm:h-[340px] lg:h-[420px]">
            {textPanels}
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="hud-ticker text-neutral-600 flex items-center gap-2">
            {t("landing.cockpitHint", "Desplázate para explorar el protocolo")}
          </span>
          <ChevronDown className="scroll-hint h-5 w-5 text-red-500/70" />
        </div>
      </div>
    </section>
  );
}

/* ── Interactive impact simulator ──────────────────────────────────── */
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
  const tier = tiers.find((t2) => g >= t2.min && g < t2.max) || tiers[tiers.length - 1];
  const pct = Math.min(100, (g / 20) * 100);
  const lesionPct = Math.min(98, Math.round(Math.pow(g, 1.7) * 1.4));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="hud-frame card-premium p-6 sm:p-8 lg:p-10 relative overflow-hidden"
      style={{ borderRadius: 22 }}
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-500/10 blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-red-500/5 blur-[110px] pointer-events-none" />
      <div className="relative grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, ...easeGentle }}
            className="inline-flex items-center gap-2 text-red-400 text-xs font-mono uppercase tracking-[0.2em] mb-4"
          >
            <Radar size={16} className="animate-spin-slow" /> {t("landing.demoInteractive", "Demostración interactiva")}
            <span className="tactical-index ml-2">SIM-01</span>
          </motion.div>
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
            <motion.div className="font-mono" key={Math.round(g)} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}>
              <span className="text-4xl font-bold">{g.toFixed(1)}</span>
              <span className="text-zinc-500 text-sm ml-1">G</span>
            </motion.div>
            <motion.div
              className={`font-bold text-lg font-mono ${tier.color}`}
              key={tier.key}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {tier.label}
            </motion.div>
          </div>

          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-6">
            <motion.div
              className="h-full rounded-full"
              layout
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ width: `${pct}%`, background: tier.hex, boxShadow: `0 0 16px ${tier.hex}66` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="glass-refined rounded-xl p-3"
              key={lesionPct}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t("landing.probLesion", "Prob. de lesión")}</div>
              <div className="font-mono font-bold text-lg" style={{ color: tier.hex }}>{lesionPct}%</div>
            </motion.div>
            <div className="glass-refined rounded-xl p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t("landing.respEstimate", "Respuesta estimada")}</div>
              <div className="font-mono font-bold text-lg">{Math.max(4, 45 - g * 2)}s</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <motion.div
            className={`relative w-44 h-44 rounded-full flex items-center justify-center ${g >= 10 ? "live-ring" : ""}`}
            animate={g >= 10 ? { rotate: [0, -5, 5, -3, 3, 0] } : { rotate: 0 }}
            transition={g >= 10 ? { duration: 0.6, repeat: Infinity, repeatType: "reverse" } : { duration: 0.3 }}
          >
            <span className="absolute inset-0 rounded-full scanlines opacity-60" />
            <CrashLogoSvg className="h-28 w-28" style={{ color: tier.hex }} />
          </motion.div>
          <motion.div
            className={`rounded-xl border px-4 py-3 text-sm text-center max-w-xs ${tier.key === "critical" ? "border-red-500/40 bg-red-500/10 text-red-200" : "glass-refined"}`}
            key={tier.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Brain size={15} className="inline mr-1.5 -mt-0.5" />
            {tier.ai}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main landing ──────────────────────────────────────────────────── */
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
      try {
        const { data } = await api.get("/versions/latest", { params: { platform: "android" } });
        if (data?.download_url) {
          if (data.download_url.startsWith("/")) {
            data.download_url = `${api.defaults.baseURL}/versions/${data.id}/download`;
          }
          setAppVersion(data);
        }
      } catch {}
    })();
  }, []);

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

  /* ── Scroll-linked hero parallax ─────────────────────────────── */
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.08]);

  /* ── Stagger container variants ────────────────────────────────── */
  const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const scaleInItem = {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
  };

  const heroWords = t("landing.heroTitle", "Alerta crítica que previene y responde al accidente en tiempo real.").split(" ");
  const heroSub = t("landing.heroSub", "C.R.A.S.H. (Critical Response Alert System for Helmets) detecta impactos en el casco, analiza la gravedad con IA y alerta de inmediato con ubicación a tus contactos y al centro de monitoreo.");

  const heroStats = [
    { icon: Activity, v: 20, suffix: "ms", l: "Detección" },
    { icon: Zap, v: 99, suffix: "%", l: "Precisión IA" },
    { icon: Users, v: 386000, l: "Usuarios moto" },
    { icon: ShieldAlert, v: 61869, l: "Accidentes/año" },
  ];

  const handleSpot = useCallback((e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);

  return (
    <div className="page-enter bg-[#050505] text-white min-h-screen relative">
      <ScrollProgress />
      <CursorSpotlight />
      <Grain />
      <ParticleBackground />

      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] grid-pan" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-red-500/10 blur-[120px] orb-float" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[120px] orb-float-2" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-red-500/5 blur-[100px] orb-float-3" />
      </div>

      <div className="relative z-10">
        {/* ── ISLAND NAV ──────────────────────────────────────────── */}
        <motion.header
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
        >
          <div className="mx-auto max-w-5xl rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] px-3 sm:px-5 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <Brand compact />
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              {[
                { href: "#ecosistema", l: t("landing.navEco", "Ecosistema") },
                { href: "#cockpit", l: t("landing.navCockpit", "Cabina") },
                { href: "#simulador", l: t("landing.navSim", "Simulador") },
                { href: "#planes", l: t("landing.navPlanes", "Planes") },
              ].map((n) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  whileHover={{ y: -1 }}
                  className="hud-ticker text-neutral-400 hover:text-white transition-colors"
                >
                  {n.l}
                </motion.a>
              ))}
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                onClick={() => setCartOpen(true)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="relative p-2 text-zinc-300 hover:text-white transition-colors"
                aria-label={t("landing.cartOpenAria", "Abrir carrito")}
              >
                <ShoppingCart size={19} />
                <AnimatePresence>
                  {cart.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-mono font-bold"
                    >
                      {cart.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <Magnetic strength={0.12}>
                <Link
                  to="/login"
                  className="btn-gradient-border text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-2 rounded-full inline-block"
                >
                  {t("landing.navAccess", "Acceso monitoristas")}
                </Link>
              </Magnetic>
            </div>
          </div>
        </motion.header>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
            <img src={HERO} alt={t("landing.heroAlt", "Motociclista de noche")} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/85" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,#050505)" }} />
          </motion.div>
          <div className="absolute inset-0 opacity-40 scanlines pointer-events-none" />

          {/* Chips de telemetría flotantes */}
          <HeroChip className="hidden lg:block top-24 right-[8%]" label="G-FORCE" value="4.2" unit="G" hint="PICO REGISTRADO · 14:32:08" delay="0s" />
          <HeroChip className="hidden lg:block top-[46%] right-[4%]" anim="chip-float-2" label="RSP TIME" value="8.2" unit="s" hint="RESPUESTA ESTIMADA" delay="1.2s" />
          <HeroChip className="hidden lg:block bottom-40 left-[5%]" anim="chip-float-2" label="GPS LOCK" value="27.48°N 99.50°W" hint="NUEVO LAREDO · MX" delay="0.6s" />

          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-24 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2.5 border border-white/15 rounded-full px-4 py-1.5 text-xs font-mono text-zinc-300 mb-6 glass-refined"
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]"
              />
              {t("landing.heroBadge", "Ecosistema de cascos · Monitoreo en vivo")}
              <span className="tactical-index">v3.0</span>
            </motion.div>

            <motion.h1
              className="text-white font-bold font-mono text-3xl sm:text-5xl lg:text-[3.4rem] tracking-tight max-w-3xl leading-[1.06] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            >
              {heroWords.map((w, i) => {
                const accent = i >= heroWords.length - 2;
                return (
                  <motion.span
                    key={`${w}-${i}`}
                    className={`inline-block mr-[0.26em] ${accent ? "bg-gradient-to-r from-red-500 via-red-400 to-orange-300 bg-clip-text text-transparent" : ""}`}
                    initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: 0.35 + i * 0.055, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {w}
                  </motion.span>
                );
              })}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="text-zinc-200 text-base md:text-lg mt-6 max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
            >
              {heroSub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-wrap gap-3 mt-8"
            >
              {appVersion && (
                <Magnetic>
                  <motion.a href={appVersion.download_url} target="_blank" rel="noreferrer" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    className="bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.35)] transition-colors">
                    <Download size={18} /> {t("landing.heroDownload", "Descargar app")} <span className="font-mono text-xs opacity-70">v{appVersion.version}</span>
                  </motion.a>
                </Magnetic>
              )}
              <Magnetic>
                <motion.a href="#planes" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  className="bg-white text-black font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-white/10">
                  {t("landing.heroCtaPlans", "Ver planes")} <ArrowRight size={18} />
                </motion.a>
              </Magnetic>
              <Magnetic>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/login" className="border border-white/20 hover:border-white/50 font-bold px-6 py-3 rounded-full transition-all inline-block">
                    {t("landing.heroCtaControl", "Centro de control")}
                  </Link>
                </motion.div>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.05, duration: 0.6 }}
              className="mt-8 hud-ticker text-neutral-500 flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />SENSORES EN LÍNEA</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />LINK ESTABLE</span>
              <span>G-MAX <span className="text-white">4.2</span></span>
              <span>MODELO <span className="text-white">v3.0</span></span>
              <span className="tick-blink text-red-400">▌</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.15 }}
              className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl"
            >
              {heroStats.map((s, i) => (
                <motion.div
                  key={s.l}
                  whileHover={{ y: -4, borderColor: "rgba(239,68,68,0.35)" }}
                  className="hud-frame glass-refined rounded-2xl px-4 py-3.5 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon size={13} className="text-red-400" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t(`landing.stat${i}`, s.l)}</span>
                  </div>
                  <div className="font-mono font-bold text-2xl tactical-num"><Counter to={s.v} suffix={s.suffix || ""} /></div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="relative flex justify-center pb-8 pointer-events-none"
          >
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ChevronDown size={26} className="text-zinc-500" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── MARQUEE ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="marquee-mask overflow-hidden border-y border-white/[0.04] py-4 bg-white/[0.015]"
        >
          <div className="marquee-track">
            {[...TRUST, ...TRUST].map((it, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-6 text-sm text-zinc-500 font-mono uppercase tracking-wider">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1.5 h-1.5 rounded-full bg-red-500/70"
                />
                {t(`landing.${it.key}`, it.label)}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── ECOSYSTEM (bento asimétrico) ───────────────────────────── */}
        <section id="ecosistema" className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <ScrollReveal>
            <div className="hud-ticker text-red-400 mb-3 flex items-center gap-3">
              <Radio size={14} className="animate-pulse" /> {t("landing.eyebrow3Components", "Los 3 componentes")}
            </div>
            <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-12">{t("landing.titleEcosystem", "Un ecosistema sincronizado")}</h2>
          </ScrollReveal>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-6 gap-5">
            <motion.div variants={scaleInItem} className="md:col-span-4">
              <TiltCard onMouseMove={handleSpot} className="hud-frame glass-refined card-spot rounded-3xl p-8 h-full">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span className="tactical-index">01 / APP MÓVIL</span>
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center my-4">
                      <Smartphone size={22} className="text-red-400" />
                    </div>
                    <div className="font-bold font-mono text-xl">{t("landing.heroMobile", "App Móvil")}</div>
                    <div className="text-red-500 text-xs font-mono uppercase tracking-wider mt-1 mb-2">{t("landing.heroMobileSub", "El Escudo del Conductor")}</div>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-md">{t("landing.heroMobileDesc", "Cero distracciones en marcha, caja negra offline y botón de pánico silencioso en el casco.")}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-center gap-2 pt-8">
                    <div className="wave-bars h-16">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span key={i} style={{ animationDelay: `${(i % 7) * 0.11}s`, height: `${18 + ((i * 29) % 46)}px` }} />
                      ))}
                    </div>
                    <span className="hud-ticker text-neutral-600 mt-2">TELEMETRÍA IMU</span>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
            <motion.div variants={scaleInItem} className="md:col-span-2">
              <TiltCard onMouseMove={handleSpot} className="hud-frame glass-refined card-spot rounded-3xl p-8 h-full">
                <span className="tactical-index">02 / HARDWARE</span>
                <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center my-4">
                  <Cpu size={22} className="text-red-400" />
                </div>
                <div className="font-bold font-mono text-xl">{t("landing.heroBackend", "Backend / Dispositivo")}</div>
                <div className="text-red-500 text-xs font-mono uppercase tracking-wider mt-1 mb-2">{t("landing.heroBackendSub", "El Cerebro")}</div>
                <p className="text-zinc-400 text-sm leading-relaxed">{t("landing.heroBackendDesc", "Arduino Nano + MPU-6050 detecta impactos en milisegundos, con filtro de acelerómetro e IA de gravedad.")}</p>
                <div className="mt-5 flex items-center gap-2 hud-ticker text-neutral-500">
                  <span className="glow-dot bg-red-500 text-red-500" /> MPU-6050
                </div>
              </TiltCard>
            </motion.div>
            <motion.div variants={scaleInItem} className="md:col-span-6">
              <TiltCard onMouseMove={handleSpot} className="hud-frame glass-refined card-spot rounded-3xl p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="tactical-index">03 / CENTRO DE CONTROL</span>
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center my-4">
                      <Monitor size={22} className="text-red-400" />
                    </div>
                    <div className="font-bold font-mono text-xl">{t("landing.heroDashboard", "Dashboard Web")}</div>
                    <div className="text-red-500 text-xs font-mono uppercase tracking-wider mt-1 mb-2">{t("landing.heroDashboardSub", "Centro de Monitoreo")}</div>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-md">{t("landing.heroDashboardDesc", "WebSockets en vivo, gestión por excepción y difusión automática a contactos y autoridades.")}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["G 4.2", "ALERTAS 0", "BT 12", "GPS LOCK", "BAT 98%", "CACHÉ OK"].map((cell, i) => (
                      <motion.div key={cell}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="hud-frame rounded-xl border border-white/10 bg-black/40 px-3 py-4 text-center">
                        <div className="font-mono font-bold text-sm text-white">{cell.split(" ")[0]}</div>
                        <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-600 mt-1">{cell.split(" ")[1]}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </motion.div>
        </section>

        {/* ── FEATURES (spotlight hover) ──────────────────────────────── */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-10">
          <ScrollReveal>
            <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-12">{t("landing.titleProtection", "Protección en cada kilómetro")}</h2>
          </ScrollReveal>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.key} variants={scaleInItem}>
                <TiltCard onMouseMove={handleSpot} className="hud-frame glass-refined card-spot rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <f.icon size={20} className="text-red-400" />
                    </div>
                    <span className="tactical-index">0{i + 1}</span>
                  </div>
                  <div className="font-bold mb-1.5 text-[15px]">{t(`landing.${f.key}`, f.t)}</div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${f.key}Desc`, f.d)}</p>
                  <div className="mt-4 h-px bg-gradient-to-r from-red-500/25 to-transparent" />
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── COCKPIT (historia pinned) ───────────────────────────────── */}
        <CockpitSection t={t} />

        {/* ── IMPACT SIMULATOR ───────────────────────────────────────── */}
        <section id="simulador" className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <ScrollReveal>
            <div className="hud-ticker text-red-400 mb-3 flex items-center gap-3">
              <Brain size={14} className="animate-pulse" /> {t("landing.eyebrowAI", "Inteligencia Artificial")}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={1} className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-8">{t("landing.titleBrain", "Prueba el cerebro de C.R.A.S.H.")}</ScrollReveal>
          <ImpactSimulator />
        </section>

        {/* ── GEOFENCE ───────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <ScrollReveal>
            <TiltCard onMouseMove={handleSpot} className="hud-frame card-premium card-spot p-8 lg:p-12 relative overflow-hidden" style={{ borderRadius: 20 }}>
              <Crosshair size={140} className="absolute -right-8 -bottom-8 text-red-500/10 opacity-60" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-red-400 text-xs font-mono uppercase tracking-[0.2em] mb-4">
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
                    <motion.div key={s.label} whileHover={{ x: 4 }} className="flex items-center gap-3 text-sm">
                      <s.icon size={18} className="text-red-400" />
                      <div>
                        <div className="text-zinc-500 text-xs">{t(`landing.geoLabel${i}`, s.label)}</div>
                        <div className="text-white font-semibold">{t(`landing.geoVal${i}`, s.value)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </section>

        {/* ── VIDEO DEMO ──────────────────────────────────────────────── */}
        <section id="demo" className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <ScrollReveal className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-8">{t("landing.titleAction", "Vélo en acción")}</ScrollReveal>
          <ScrollReveal delay={1}>
            <motion.div
              whileHover={{ scale: 1.008 }}
              className="hud-frame relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video card-premium"
              style={{ borderRadius: 20 }}
            >
              <video
                className="w-full h-full object-cover"
                autoPlay muted loop playsInline disablePictureInPicture disableRemotePlayback
                preload="auto"
                poster={HERO}
                src="/videos/CrashVideo.mp4"
              >
                {t("landing.videoFallback", "Tu navegador no soporta el elemento de video.")}
              </video>
              <div className="pointer-events-none absolute inset-0 scanlines opacity-50" />
              <div className="absolute top-4 left-4 flex items-center gap-2 hud-ticker text-red-300 bg-black/60 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-red-500/30">
                <span className="glow-dot bg-red-500 text-red-500" /> LIVE
              </div>
              <div className="absolute bottom-4 right-4 hud-ticker text-neutral-400 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                DEMO · 00:00:00
              </div>
            </motion.div>
          </ScrollReveal>
        </section>

        {/* ── PROJECT MEMORY ─────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <ScrollReveal>
            <div className="hud-frame card-premium p-8 lg:p-12 relative overflow-hidden" style={{ borderRadius: 20 }}>
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-red-500/10 blur-[100px]" />
              <div className="relative">
                <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-3">{t("landing.titleMemory", "Memoria del proyecto · InnovaTecNM 2026")}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">{t("landing.projDesc", PROJECT_META.descripcion)}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm mb-8">
                  <div className="glass-refined rounded-xl px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelEvento", "Evento")}</div><div className="font-medium">{t("landing.projEvento", PROJECT_META.evento)}</div></div>
                  <div className="glass-refined rounded-xl px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelSede", "Sede")}</div><div className="font-medium">{t("landing.projSede", PROJECT_META.sede)}</div></div>
                  <div className="glass-refined rounded-xl px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelFolioCat", "Folio · Categoría")}</div><div className="font-medium">{PROJECT_META.folio} · {t("landing.projCategoria", PROJECT_META.categoria)}</div></div>
                  <div className="glass-refined rounded-xl px-4 py-3"><div className="text-zinc-500 text-xs">{t("landing.labelArea", "Área")}</div><div className="font-medium">{t("landing.projArea", PROJECT_META.area)}</div></div>
                </div>

                <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowProblem", "Problemática")}</div>
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {PROBLEMS.map((p) => (
                    <motion.div key={p.key} className="glass-refined rounded-xl p-5 transition-colors hover:border-red-500/30">
                      <div className="font-bold text-[15px] mb-1.5 text-red-300">{t(`landing.${p.key}`, p.t)}</div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${p.key}Desc`, p.d)}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowValue", "Propuesta de valor")}</div>
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {VALUE.map((v) => (
                    <motion.div key={v.key} className="glass-refined rounded-xl p-5 transition-colors hover:border-red-500/30">
                      <div className="font-bold text-[15px] mb-1.5 text-red-300">{t(`landing.${v.key}`, v.t)}</div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${v.key}Desc`, v.d)}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowArch", "Arquitectura técnica")}</div>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {ARCH.map((a) => (
                    <motion.div key={a.key} className="glass-refined rounded-xl p-5 transition-colors hover:border-red-500/30">
                      <div className="font-bold text-[15px] mb-1.5">{t(`landing.${a.key}`, a.t)}</div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t(`landing.${a.key}Desc`, a.d)}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowTeam", "Equipo · Autores")}</div>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      {TEAM.map((m) => (
                        <motion.li key={m} className="flex items-start gap-2"><Users size={14} className="text-red-400 mt-1 shrink-0" /><span>{m}</span></motion.li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">{t("landing.eyebrowAdvisors", "Asesores")}</div>
                    <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                      {ADVISORS.map((a) => (
                        <motion.li key={a} className="flex items-start gap-2"><Building2 size={14} className="text-red-400 mt-1 shrink-0" /><span>{a}</span></motion.li>
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
            </div>
          </ScrollReveal>
        </section>

        {/* ── PLANS ──────────────────────────────────────────────────── */}
        <section id="planes" className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <ScrollReveal>
            <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-2">{t("landing.titlePlans", "Planes y precios")}</h2>
            <p className="text-zinc-400 mb-6 text-sm max-w-2xl">
              {t("landing.planesIntro", "El precio a empresas (B2B) es superior al del usuario final (B2C) porque incluye dashboard corporativo, telemetría de flotilla e instalación. Elige tu perfil para ver precios en MXN.")}
            </p>
          </ScrollReveal>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex gap-1 border border-white/10 rounded-full p-1 mb-6 bg-white/[0.02]"
          >
            <motion.button
              onClick={() => setAudience("b2c")}
              whileTap={{ scale: 0.97 }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${audience === "b2c" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              <Users size={15} /> {t("landing.audienceB2c", "Usuario (B2C)")}
            </motion.button>
            <motion.button
              onClick={() => setAudience("b2b")}
              whileTap={{ scale: 0.97 }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${audience === "b2b" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              <Building2 size={15} /> {t("landing.audienceB2b", "Empresa (B2B)")}
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {audience === "b2c" ? (
              <motion.div
                key="b2c"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-5"
              >
                <TiltCard className="hud-frame glass-refined p-6 flex flex-col rounded-3xl" style={{ borderRadius: 20 }}>
                  <div className="font-bold font-mono text-2xl">{t("landing.planPersonal", "Plan Personal")}</div>
                  <div className="text-zinc-500 text-sm mt-1">{t("landing.planPersonalDesc", "Protección para motociclistas particulares y repartidores independientes.")}</div>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="font-mono font-bold text-4xl tactical-num">{mx(subB2C)}</span>
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
                        <Check size={15} className="text-red-400 shrink-0" /> {t(`landing.b2cFeat${i + 1}`, f)}
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <motion.button
                      onClick={() => addItems([{ key: `b2c-device`, kind: "device", audience: "b2c" }])}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-full transition-all hover:bg-white/5 text-sm"
                    >
                      {t("landing.btnDevice", "Dispositivo")} {mx(deviceB2C)}
                    </motion.button>
                    <motion.button
                      onClick={() => addItems([{ key: `b2c-sub-${cycle}`, kind: "b2csub", cycle }])}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white text-black font-bold py-3 rounded-full transition-all hover:bg-zinc-200 text-sm"
                    >
                      {t("landing.btnSubscription", "Suscripción")}
                    </motion.button>
                  </div>
                </TiltCard>

                <TiltCard className="hud-frame glass-refined p-6 flex flex-col justify-center rounded-3xl" style={{ borderRadius: 20 }}>
                  <div className="text-red-400 text-xs font-mono uppercase tracking-[0.2em] mb-3">{t("landing.whyCrash", "¿Por qué C.R.A.S.H.?")}</div>
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
                      <span className="font-mono font-bold text-red-400">$800 MXN</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ) : (
              <motion.div
                key="b2b"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="inline-flex flex-wrap gap-1 border border-white/10 rounded-full p-1 mb-8 bg-white/[0.02]">
                  {CYCLES.map((c) => (
                    <motion.button
                      key={c.key}
                      onClick={() => setCycle(c.label)}
                      whileTap={{ scale: 0.97 }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${cycle === c.label ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
                    >
                      {t(`landing.${c.key}`, c.label)}
                    </motion.button>
                  ))}
                </div>

                <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-5">
                  {plans.map((p) => (
                    <motion.div key={p.name} variants={scaleInItem}>
                      <TiltCard
                        className={`hud-frame glass-refined p-6 flex flex-col transition-all duration-300 rounded-3xl ${p.popular ? "shimmer-border ring-1 ring-white/10 scale-[1.02]" : ""}`}
                        style={{ borderRadius: 20 }}
                      >
                        {p.popular && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 mb-3 bg-red-500/10 px-2.5 py-1 rounded-full self-start">
                            <Check size={10} /> {t("landing.popular", "Más popular")}
                          </div>
                        )}
                        <div className="font-bold font-mono text-2xl">{p.name}</div>
                        <div className="text-zinc-500 text-sm mt-1">{t("landing.planDrivers", "Hasta {d} repartidores · {m} monitores").replace("{d}", p.max_drivers).replace("{m}", p.max_monitors)}</div>
                        <div className="mt-6 flex items-end gap-2">
                          <span className="font-mono font-bold text-4xl tactical-num">{mx(Math.round((p.price || 0) * (CYCLE_MULT[cycle] || 1)))}</span>
                          <span className="text-zinc-500 text-sm mb-1 font-mono">{t(`landing.cycleSlash${cycle}`, `/ ${cycle.toLowerCase()}`)}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">{t("landing.planIncludesSaas", "Incluye SaaS a {amt} por repartidor/mes").replace("{amt}", mx(subB2BPerDriver))}</div>
                        <ul className="mt-6 space-y-3 text-sm flex-1">
                          {(p.features && p.features.length ? p.features : ["Monitoreo en tiempo real", "Alertas de impacto", "Historial de telemetría", "Soporte"]).map((f, i) => (
                            <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                              <Check size={15} className="text-red-400 shrink-0" />
                              {p.features && p.features.length ? f : t(`landing.b2bDefFeat${i}`, f)}
                            </li>
                          ))}
                        </ul>
                        <div className="grid grid-cols-2 gap-2 mt-6">
                          <motion.button
                            onClick={() => addItems([{ key: `b2b-device`, kind: "device", audience: "b2b" }])}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-full transition-all hover:bg-white/5 text-sm"
                          >
                            {t("landing.btnDisp", "Disp.")} {mx(deviceB2B)}
                          </motion.button>
                          <motion.button
                            onClick={() => addItems([{ key: `plan-${p.name}-b2b-${cycle}`, kind: "plan", planName: p.name, cycle }])}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`font-bold py-3 rounded-full transition-all text-sm ${p.popular ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10" : "border border-white/15 hover:border-white/40 hover:bg-white/5"}`}
                          >
                            {t("landing.btnPlan", "Plan")}
                          </motion.button>
                        </div>
                      </TiltCard>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-zinc-600 mt-8 leading-relaxed max-w-2xl">
            {t("landing.plansFooter", "El precio B2B (empresa) es superior al B2C porque suma instalación, soporte, dashboard corporativo con telemetría de flotilla y prevención de accidentes laborales. Las empresas acceden a un Centro de Control que reduce primas de seguro y responsabilidad civil.")}
          </p>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/[0.04] py-12 text-center"
        >
          <div className="max-w-6xl mx-auto px-4">
            <motion.div className="flex items-center justify-center gap-2 mb-4" whileHover={{ scale: 1.02 }}>
              <Brand compact />
            </motion.div>
            <div className="flex items-center justify-center gap-3 hud-ticker text-neutral-600 mb-3">
              <span className="glow-dot bg-emerald-400 text-emerald-400" /> SISTEMA OPERATIVO · STATUS NOMINAL
            </div>
            <p className="text-zinc-600 text-sm font-mono">
              {t("landing.footerTag", "Critical Response Alert System for Helmets · Hecho en México")}
            </p>
          </div>
        </motion.footer>
      </div>

      {cartOpen && createPortal((
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="hud-frame glass-refined relative w-full max-w-md max-h-[85vh] bg-[#0a0a0a] rounded-2xl flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="px-5 h-16 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
              <span className="font-bold font-mono flex items-center gap-2 text-base">
                <ShoppingCart size={18} /> {t("landing.cartTitle", "Carrito")} {cart.length > 0 && <span className="text-xs text-zinc-500">({cart.length})</span>}
              </span>
              <motion.button
                onClick={() => setCartOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                aria-label={t("landing.cartCloseAria", "Cerrar carrito")}
              >
                <X size={16} />
              </motion.button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              <AnimatePresence>
                {cart.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center py-10 gap-3">
                    <ShoppingCart size={32} className="text-zinc-700" />
                    <p className="text-zinc-600 text-sm">{t("landing.cartEmpty", "Tu carrito está vacío.")}</p>
                    <p className="text-zinc-700 text-xs">{t("landing.cartAdd", "Agrega un plan para comenzar.")}</p>
                  </motion.div>
                )}
                {cart.map((i) => (
                  <motion.div
                    key={i.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="glass-refined p-3.5 flex items-center justify-between gap-3 overflow-hidden rounded-xl"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{labelOf(i)}</div>
                      <div className="font-mono text-zinc-400 text-sm mt-0.5">{mx(priceOfItem(i))}</div>
                    </div>
                    <motion.button
                      onClick={() => removeFromCart(i.key)}
                      whileHover={{ scale: 1.1, color: "#ef4444" }}
                      className="w-7 h-7 shrink-0 rounded-md border border-white/10 flex items-center justify-center text-zinc-500 transition-colors"
                      aria-label="Quitar del carrito"
                    >
                      <X size={13} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="p-4 border-t border-white/[0.06] space-y-3 bg-black/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm uppercase tracking-wider font-mono">{t("landing.cartTotal", "Total")}</span>
                <motion.span key={total} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-mono font-bold text-2xl tactical-num">{mx(total)}</motion.span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {t("landing.cartInfo", "Recibe la información del plan por WhatsApp o correo. La compra es simulada: al confirmar generamos tus tokens.")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <motion.button onClick={orderWhatsApp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-red-500 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(239,68,68,0.3)]">
                  <MessageCircle size={20} /> {t("landing.cartWhatsapp", "WhatsApp")}
                </motion.button>
                <motion.button onClick={orderEmail} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all hover:bg-white/5">
                  <Mail size={20} /> {t("landing.cartEmail", "Correo")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ), document.body)}
    </div>
  );
}

export default memo(Landing);
