import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Smartphone, Cpu, Monitor, Lock, Network, Siren, Navigation,
  WifiOff, MessagesSquare, Database, ShoppingCart, X, MessageCircle, Mail,
  Check, ArrowRight, MapPin, History, Signal, Users, Building2,
} from "lucide-react";
import { api } from "../lib/api";

const CONTACT_WHATSAPP = "5210000000000000"; // Reemplaza con el numero real de ventas C.R.A.S.H.
const CONTACT_EMAIL = "contacto@crash.io";
const CYCLES = ["Semanal", "Mensual", "Bimestral", "Trimestral", "Anual"];
const CYCLE_MULT = { Semanal: 0.3, Mensual: 1, Bimestral: 1.9, Trimestral: 2.7, Anual: 9.6 };
const HERO = "https://images.pexels.com/photos/2611685/pexels-photo-2611685.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

// Precios base del modelo de negocio C.R.A.S.H. (MXN). Fuente: modelo de negocios del proyecto.
const B2C_DEVICE = 1499; // Dispositivo B2C (margen 46%, costo $800)
const B2C_SUB = 49;      // Suscripcion app B2C por mes
const B2B_DEVICE = 1999; // Dispositivo B2B (incluye instalacion y soporte)
const B2B_SUB_PER_DRIVER = 150; // SaaS por repartidor/mes

const mx = (n) => `$${Number(Math.round(n)).toLocaleString("es-MX")} MXN`;

const HERO_SUB = [
  { icon: Smartphone, t: "App Móvil", s: "El Escudo del Conductor", d: "Cero distracciones en marcha, caja negra offline y botón de pánico silencioso en el casco." },
  { icon: Cpu, t: "Backend / Dispositivo", s: "El Cerebro", d: "Arduino Nano + MPU-6050 detecta impactos en milisegundos, con filtro de acelerómetro e IA de gravedad." },
  { icon: Monitor, t: "Dashboard Web", s: "Centro de Monitoreo", d: "WebSockets en vivo, gestión por excepción y difusión automática a contactos y autoridades." },
];

const FEATURES = [
  { icon: Lock, t: "Bloqueo por conducción", d: "Sobre 5 km/h la app prioriza la ruta y oculta distracciones. Si el conductor abre redes sociales, se genera reporte automático." },
  { icon: Navigation, t: "HUD Nocturno", d: "Pantalla de alto contraste con modo reflejo para parabrisas en rutas nocturnas de alto riesgo." },
  { icon: MessagesSquare, t: "Chat con bloqueo", d: "En movimiento solo respuestas rápidas con un toque. El texto libre se desbloquea a 0 km/h." },
  { icon: Database, t: "Caja Negra del Casco", d: "Almacena telemetría IMU local y envía en ráfaga al recuperar la señal en zonas muertas." },
  { icon: Siren, t: "Pánico Silencioso", d: "Patrón de botones que activa protocolo silencioso, comparte ubicación y manda alerta roja." },
  { icon: WifiOff, t: "Detección de pérdida de señal", d: "Si pierde conexión fuera de una zona muerta conocida, se asume emergencia y alerta al centro." },
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

function Landing() {
  const [plans, setPlans] = useState([]);
  const [cycle, setCycle] = useState("Mensual");
  const [audience, setAudience] = useState("b2c");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/plans"); setPlans(data || []); } catch { setPlans([]); }
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
    if (item.kind === "device") return `Kit C.R.A.S.H. (${item.audience === "b2b" ? "Empresa" : "Usuario"})`;
    if (item.kind === "b2csub") return `Suscripción App (${item.cycle})`;
    if (item.kind === "plan") return `Plan ${item.planName} (${item.cycle})`;
    return item.name || "Producto";
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
    let msg = "Hola, quiero contratar C.R.A.S.H.:%0A%0A";
    cart.forEach((i) => { msg += `• ${labelOf(i)}: ${mx(priceOfItem(i)).replace(/ /g, "%20")}%0A`; });
    msg += `%0ATOTAL: ${mx(total).replace(/ /g, "%20")}`;
    return msg;
  };
  const orderWhatsApp = () => {
    if (!cart.length) return;
    window.open(`https://wa.me/${CONTACT_WHATSAPP}?text=${buildMessage()}`, "_blank");
  };
  const orderEmail = () => {
    if (!cart.length) return;
    const body = buildMessage().replace(/%0A/g, "\n").replace(/%20/g, " ");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Pedido C.R.A.S.H.")}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="page-enter bg-[#050505] text-white min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
                <CrashLogo className="h-5 w-5" />
              </div>
              <span className="font-bold font-mono text-lg tracking-tight">
                C.R.A.S.H<span className="text-red-500">.</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <a href="#planes" className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors font-medium">Planes</a>
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-zinc-300 hover:text-white transition-colors"
                aria-label="Abrir carrito"
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
                className="text-sm bg-white text-black font-bold px-4 py-2 rounded-xl hover:bg-zinc-200 transition-all hover-lift"
              >
                Acceso monitoristas
              </Link>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={HERO} alt="Motociclista de noche" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/75" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,#050505)" }} />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-28 lg:py-40">
            <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-mono text-zinc-300 mb-6 fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-safe" />
              Ecosistema de cascos · Monitoreo en vivo
            </div>
            <h1 className="font-bold font-mono text-4xl sm:text-5xl lg:text-6xl tracking-tight max-w-3xl leading-[1.05] fade-up" style={{ animationDelay: "0.1s" }}>
              Alerta crítica que <span className="text-gradient font-bold">previene</span> y responde al accidente en tiempo real.
            </h1>
            <p className="text-zinc-300 text-base md:text-lg mt-6 max-w-xl fade-up" style={{ animationDelay: "0.2s" }}>
              C.R.A.S.H. (Critical Response Alert System for Helmets) detecta impactos en el casco, analiza la gravedad con IA y alerta de inmediato con ubicación a tus contactos y al centro de monitoreo.
            </p>
            <div className="flex flex-wrap gap-3 mt-8 fade-up" style={{ animationDelay: "0.3s" }}>
              <a href="#planes" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-white/10">
                Ver planes <ArrowRight size={18} />
              </a>
              <Link to="/login" className="border border-white/20 hover:border-white/50 font-bold px-6 py-3 rounded-xl transition-all">
                Centro de control
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">Los 3 componentes</div>
          <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-10">Un ecosistema sincronizado</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {HERO_SUB.map((c, i) => (
              <div key={c.t} className="card-premium p-8 hover-lift fade-up" style={{ animationDelay: `${0.1 * i}s`, borderRadius: 20 }}>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <c.icon size={26} className="text-white" />
                </div>
                <div className="font-bold font-mono text-lg">{c.t}</div>
                <div className="text-red-500 text-xs font-mono uppercase tracking-wider mb-3 mt-1">{c.s}</div>
                <p className="text-zinc-400 text-sm leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">Características</div>
          <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-10">Protección en cada kilómetro</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.t} className="card-premium p-6 hover-lift fade-up" style={{ animationDelay: `${0.05 * i}s`, borderRadius: 16 }}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-emerald-400" />
                </div>
                <div className="font-bold mb-1.5 text-[15px]">{f.t}</div>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-24">
          <div className="card-premium p-8 lg:p-12 relative overflow-hidden hover-lift" style={{ borderRadius: 20 }}>
            <Network size={160} className="absolute -right-8 -bottom-8 text-emerald-500/10" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-[0.2em] mb-4">
                <Network size={16} /> Factor Ciudad
              </div>
              <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight max-w-2xl">Módulo de Geocercas de Riesgo</h2>
              <p className="text-zinc-400 mt-4 max-w-2xl leading-relaxed">
                Al entrar a zonas de alto riesgo (curvas peligrosas, túneles o escolares), se activa una geocerca de <b className="text-white">Precaución</b>: cronometra el tiempo exacto en la zona, pausa alertas por detención y mide la fuerza-G para anticipar caídas.
              </p>
              <div className="flex flex-wrap gap-6 mt-6">
                {[
                  { icon: MapPin, label: "Geocercas", value: "Curvas, túneles, escolares" },
                  { icon: History, label: "Monitoreo", value: "Tiempo exacto en zona" },
                  { icon: Signal, label: "Alertas", value: "Pausa automática" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-sm">
                    <s.icon size={18} className="text-emerald-400" />
                    <div>
                      <div className="text-zinc-500 text-xs">{s.label}</div>
                      <div className="text-white font-semibold">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="planes" className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3 font-mono">Suscripciones</div>
          <h2 className="font-bold font-mono text-2xl sm:text-3xl tracking-tight mb-2">Planes y precios</h2>
          <p className="text-zinc-400 mb-6 text-sm max-w-2xl">
            El precio a empresas (B2B) es superior al del usuario final (B2C) porque incluye dashboard corporativo,
            telemetría de flotilla e instalación. Elige tu perfil para ver precios en MXN.
          </p>

          <div className="inline-flex gap-1 border border-white/10 rounded-xl p-1 mb-6 bg-white/[0.02]">
            <button
              onClick={() => setAudience("b2c")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${audience === "b2c" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              <Users size={15} /> Usuario (B2C)
            </button>
            <button
              onClick={() => setAudience("b2b")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${audience === "b2b" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              <Building2 size={15} /> Empresa (B2B)
            </button>
          </div>

          {audience === "b2c" ? (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="card-premium p-6 flex flex-col hover-lift" style={{ borderRadius: 20 }}>
                <div className="font-bold font-mono text-2xl">Plan Personal</div>
                <div className="text-zinc-500 text-sm mt-1">Protección para motociclistas particulares y repartidores independientes.</div>
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
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                      <Check size={15} className="text-emerald-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  <button
                    onClick={() => addItems([{ key: `b2c-device`, kind: "device", audience: "b2c" }])}
                    className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-xl transition-all hover:bg-white/5 text-sm"
                  >
                    Dispositivo {mx(deviceB2C)}
                  </button>
                  <button
                    onClick={() => addItems([{ key: `b2c-sub-${cycle}`, kind: "b2csub", cycle }])}
                    className="bg-white text-black font-bold py-3 rounded-xl transition-all hover:bg-zinc-200 text-sm"
                  >
                    Suscripción
                  </button>
                </div>
              </div>

              <div className="card-premium p-6 flex flex-col justify-center hover-lift" style={{ borderRadius: 20 }}>
                <div className="text-emerald-400 text-xs font-mono uppercase tracking-[0.2em] mb-3">¿Por qué C.R.A.S.H.?</div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  En 2024 se registraron <b className="text-white">61,869</b> accidentes con motocicleta en México.
                  Más de <b className="text-white">386 mil</b> personas usan la moto como herramienta de trabajo.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">Dispositivo (B2C)</span>
                    <span className="font-mono font-bold">{mx(deviceB2C)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">Suscripción / mes</span>
                    <span className="font-mono font-bold">{mx(subB2C)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Costo de producción</span>
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
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${cycle === c ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {plans.map((p) => (
                  <div
                    key={p.name}
                    className={`card-premium p-6 flex flex-col transition-all duration-300 hover-lift ${p.popular ? "border-white/20 ring-1 ring-white/10 scale-[1.02]" : ""}`}
                    style={{ borderRadius: 20 }}
                  >
                    {p.popular && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3 bg-emerald-500/10 px-2.5 py-1 rounded-full self-start">
                        <Check size={10} /> Más popular
                      </div>
                    )}
                    <div className="font-bold font-mono text-2xl">{p.name}</div>
                    <div className="text-zinc-500 text-sm mt-1">Hasta {p.max_drivers} repartidores · {p.max_monitors} monitores</div>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="font-mono font-bold text-4xl">{mx(Math.round((p.price || 0) * (CYCLE_MULT[cycle] || 1)))}</span>
                      <span className="text-zinc-500 text-sm mb-1 font-mono">/ {cycle.toLowerCase()}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Incluye SaaS a {mx(subB2BPerDriver)} por repartidor/mes</div>
                    <ul className="mt-6 space-y-3 text-sm flex-1">
                      {(p.features && p.features.length ? p.features : ["Monitoreo en tiempo real", "Alertas de impacto", "Historial de telemetría", "Soporte"]).map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                          <Check size={15} className="text-emerald-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button
                        onClick={() => addItems([{ key: `b2b-device`, kind: "device", audience: "b2b" }])}
                        className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-xl transition-all hover:bg-white/5 text-sm"
                      >
                        Disp. {mx(deviceB2B)}
                      </button>
                      <button
                        onClick={() => addItems([{ key: `plan-${p.name}-b2b-${cycle}`, kind: "plan", planName: p.name, cycle }])}
                        className={`font-bold py-3 rounded-xl transition-all text-sm ${p.popular ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10" : "border border-white/15 hover:border-white/40 hover:bg-white/5"}`}
                      >
                        Suscripción
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-xs text-zinc-600 mt-8 leading-relaxed max-w-2xl">
            El precio B2B (empresa) es superior al B2C porque suma instalación, soporte, dashboard corporativo con
            telemetría de flotilla y prevención de accidentes laborales. Las empresas acceden a un Centro de Control
            que reduce primas de seguro y responsabilidad civil.
          </p>
        </section>

        <footer className="border-t border-white/[0.04] py-12 text-center">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <CrashLogo className="h-4 w-4" />
              </div>
              <span className="font-bold font-mono tracking-tight">C.R.A.S.H<span className="text-red-500">.</span></span>
            </div>
            <p className="text-zinc-600 text-sm font-mono">
              Critical Response Alert System for Helmets · Hecho en México
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
                <ShoppingCart size={18} /> Carrito {cart.length > 0 && <span className="text-xs text-zinc-500">({cart.length})</span>}
              </span>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all" aria-label="Cerrar carrito">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                  <ShoppingCart size={32} className="text-zinc-700" />
                  <p className="text-zinc-600 text-sm">Tu carrito está vacío.</p>
                  <p className="text-zinc-700 text-xs">Agrega un plan para comenzar.</p>
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
                <span className="text-zinc-400 text-sm uppercase tracking-wider font-mono">Total</span>
                <span className="font-mono font-bold text-2xl">{mx(total)}</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Recibe la información del plan por WhatsApp o correo. La compra es simulada: al confirmar generamos tus tokens.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={orderWhatsApp} className="bg-emerald-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <MessageCircle size={20} /> WhatsApp
                </button>
                <button onClick={orderEmail} className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/5">
                  <Mail size={20} /> Correo
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
