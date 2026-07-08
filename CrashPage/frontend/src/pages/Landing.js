import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Activity, Gauge, Bell, MapPin, Brain, Check, X,
  CreditCard, Building2, Users, Wifi, HardDrive, Zap, Settings, Smartphone,
  Globe, Truck, Lock, ArrowRight, Menu, Star, Loader2, ShoppingCart,
  Monitor, ExternalLink, Clock, AlertTriangle, Key, Mail, UserPlus,
  Info, Cpu, Radio, Bluetooth, Battery, Layers, Microscope, TrendingUp,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api, formatApiError } from "../lib/api";

const DEMO_VIDEO_SRC = `${process.env.PUBLIC_URL}/videos/CrashVideo.mp4`;

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

function PlansModal({ onClose }) {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/plans"); setPlans(data); }
      catch { setPlans([]); }
      setLoading(false);
    })();
  }, []);

  const defaultPlans = [
    { name: "Basic", price: 5, max_drivers: 3, features: ["Monitoreo en vivo", "Alertas de impacto", "Historial básico (7 días)", "Soporte por correo"], popular: false },
    { name: "Advanced", price: 15, max_drivers: 10, features: ["Todo lo de Basic", "Historial completo (30 días)", "Diagnóstico con IA", "Reportes exportables", "Soporte prioritario"], popular: true },
    { name: "Enterprise", price: 25, max_drivers: 30, features: ["Todo lo de Advanced", "Historial ilimitado", "Webhook personalizado", "API de integración", "Soporte 24/7 dedicado", "Onboarding asistido"], popular: false },
  ];
  const display = plans || defaultPlans;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><CreditCard className="h-5 w-5 text-emerald-400" /></div>
          <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Planes y precios</div><div className="font-bold text-lg">Elige tu plan</div></div>
        </div>
        {showComingSoon ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4"><Clock className="h-8 w-8 text-amber-400" /></div>
            <h3 className="text-xl font-bold mb-2">Próximamente</h3>
            <p className="text-neutral-400 max-w-sm mx-auto mb-6">El sistema de compras en línea está en desarrollo. Mientras tanto, contacta al SuperAdmin para activar tu plan.</p>
            <button onClick={onClose} className="border border-white/20 hover:border-white/40 rounded-xl px-6 py-2.5 text-sm transition-all">Cerrar</button>
          </div>
        ) : selectedPlan ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-emerald-400" /></div>
            <h3 className="text-xl font-bold mb-2">{selectedPlan.name} seleccionado</h3>
            <p className="text-neutral-400 mb-4">${selectedPlan.price}/mes — {selectedPlan.max_drivers} conductores</p>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300 max-w-md mx-auto mb-6"><Clock className="h-4 w-4 inline-block mr-2" />El proceso de pago está en desarrollo. Pronto podrás completar la compra.</div>
            <button onClick={() => setSelectedPlan(null)} className="border border-white/20 hover:border-white/40 rounded-xl px-6 py-2.5 text-sm transition-all">Volver a planes</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              {display.map(plan => (
                <div key={plan.name} className={`relative rounded-2xl border p-5 transition-all hover-lift ${plan.popular ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "border-white/10 bg-white/[0.03]"}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">Más popular</div>}
                  <div className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-3"><span className="text-3xl font-bold">${plan.price}</span><span className="text-neutral-500 text-sm">/mes</span></div>
                  <div className="text-xs text-neutral-400 mb-4">Hasta {plan.max_drivers} conductores</div>
                  <ul className="space-y-2 mb-6">{plan.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-neutral-300"><Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{f}</li>)}</ul>
                  <button onClick={() => setSelectedPlan(plan)} className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${plan.popular ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "border border-white/20 hover:border-white/40 text-white"}`}>Seleccionar</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TokenGateModal({ onClose }) {
  const navigate = useNavigate();
  const { login, loginSuperAdmin, loginWithToken, error: authError } = useAuth();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [step, setStep] = useState("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [saTokenEmail, setSaTokenEmail] = useState("");

  const verifyToken = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/auth/verify-site-token", { token });
      setTokenInfo(data);
      localStorage.setItem("crash_site_token", token);
      if (data.role === "superadmin") {
        setSaTokenEmail(data.email);
        setStep("salogin");
      } else {
        setStep("monitor-login");
      }
    } catch (err) { setError(formatApiError(err)); }
    setBusy(false);
  }, [token]);

  const handleMonitorLogin = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    if (ok) navigate("/dashboard");
    setBusy(false);
  }, [email, password, login, navigate]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await loginWithToken(token, email, password, name);
    if (ok) navigate("/dashboard");
    setBusy(false);
  }, [token, email, password, name, loginWithToken, navigate]);

  const handleSaLogin = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await loginSuperAdmin(saTokenEmail, password);
    if (ok) window.location.href = "/admin";
    setBusy(false);
  }, [saTokenEmail, password, loginSuperAdmin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><X className="h-4 w-4" /></button>
        {step === "token" ? (
          <>
            <div className="mt-4 mb-5">
              <input value={token} onChange={e => setToken(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm font-mono tracking-wider outline-none transition-all text-center" placeholder="Ingrese su código" autoComplete="off" spellCheck={false} />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">{error}</div>}
            <button disabled={busy || token.length < 8} onClick={verifyToken} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "..." : "Continuar"}
            </button>
          </>
        ) : step === "salogin" ? (
          <>
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Correo electrónico</label>
              <input type="email" value={saTokenEmail} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none cursor-not-allowed opacity-60" readOnly />
            </div>
            <form onSubmit={handleSaLogin} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm outline-none transition-all" required />
              </div>
              {authError && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{authError}</div>}
              <button disabled={busy} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "..." : "Acceder al panel"}
              </button>
            </form>
          </>
        ) : step === "monitor-login" ? (
          <>
            {tokenInfo && (
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-400" /></div>
                <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Empresa</div><div className="font-bold">{tokenInfo.company_name}</div></div>
              </div>
            )}
            <p className="text-sm text-neutral-400 mb-5">Inicia sesión como monitorista para acceder al monitoreo.</p>
            <form onSubmit={handleMonitorLogin} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Correo electrónico</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm outline-none transition-all" placeholder="monitorista@correo.com" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm outline-none transition-all" required />
              </div>
              {authError && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{authError}</div>}
              <button disabled={busy} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Accediendo..." : "Acceder al monitoreo"}
              </button>
            </form>
            <div className="mt-5 text-center">
              <button onClick={() => setStep("register")} className="text-xs text-neutral-500 hover:text-emerald-300 transition-colors">
                ¿Eres nuevo? Crear cuenta de monitorista
              </button>
            </div>
          </>
        ) : (
          <>
            {tokenInfo && (
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-400" /></div>
                <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Empresa</div><div className="font-bold">{tokenInfo.company_name}</div></div>
              </div>
            )}
            <p className="text-sm text-neutral-400 mb-5">Completa tus datos para registrarte como monitorista.</p>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Nombre completo</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm outline-none transition-all" placeholder="Tu nombre" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Correo electrónico</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm outline-none transition-all" placeholder="monitorista@correo.com" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm outline-none transition-all" required />
              </div>
              {authError && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{authError}</div>}
              <button disabled={busy} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Registrando..." : "Registrarse y acceder"}
              </button>
            </form>
            <div className="mt-5 text-center">
              <button onClick={() => setStep("monitor-login")} className="text-xs text-neutral-500 hover:text-emerald-300 transition-colors">
                ¿Ya tienes cuenta? Iniciar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);
  const [showTokenGate, setShowTokenGate] = useState(false);
  const [scroll, setScroll] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const videoSectionRef = useRef(null);

  useEffect(() => {
    const handler = () => setScroll(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const section = videoSectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { video.currentTime = 0; video.play().catch(() => {}); }
        else { video.pause(); video.currentTime = 0; }
      },
      { threshold: 0.65 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scroll > 20 ? "bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-white/[0.06]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)]"><CrashLogo className="h-6 w-6" /></div>
              <div><div className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 leading-tight">Critical Response</div><div className="text-lg font-bold tracking-tight leading-tight">C.R.A.S.H.</div></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPlans(true)} className="inline-flex items-center gap-1.5 border border-white/20 hover:border-emerald-500/40 hover:text-emerald-300 text-sm rounded-xl px-4 py-2 transition-all"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Planes</span></button>
              <button onClick={() => setShowTokenGate(true)} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl px-4 py-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]"><Monitor className="h-4 w-4" /><span className="hidden sm:inline">Acceder a monitoreo</span><span className="sm:hidden">Acceder</span></button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center"><Menu className="h-5 w-5" /></button>
            </div>
          </div>
          {menuOpen && (
            <div className="lg:hidden border-t border-white/10 py-3 space-y-2">
              <button onClick={() => { setShowPlans(true); setMenuOpen(false); }} className="block w-full text-left text-sm text-neutral-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">Planes</button>
              <button onClick={() => { setShowTokenGate(true); setMenuOpen(false); }} className="block w-full text-left text-sm text-neutral-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">Acceder a monitoreo</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.03)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 text-xs text-red-300 mb-6"><Activity className="h-3.5 w-3.5" />Proyecto InnovaTec 2026</div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                C.R.A.S.H.
                <span className="gradient-text-red block mt-2">Sistema de alerta de respuesta crítica para cascos</span>
              </h1>
              <p className="mt-6 text-lg text-neutral-400 max-w-xl leading-relaxed">
                <strong>Critical Response Alert System for Helmets</strong>. Dispositivo que se instala en cascos 
                o vehículos y detecta accidentes automáticamente. Utiliza inteligencia artificial para analizar 
                la gravedad del impacto y envía alertas inmediatas con ubicación a contactos de emergencia.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => setShowTokenGate(true)} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl px-6 py-3 transition-all hover-lift shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] active:scale-[0.97]">Acceder a monitoreo<ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => setShowPlans(true)} className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white rounded-xl px-6 py-3 transition-all hover-lift active:scale-[0.97]">Ver planes<CreditCard className="h-4 w-4" /></button>
              </div>
              <div className="mt-10 flex flex-wrap gap-2">
                {["React", "FastAPI", "MongoDB", "WebSocket", "Gemini IA", "React Native", "Bluetooth", "IoT"].map(t => (
                  <span key={t} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-neutral-400 hover:border-emerald-500/30 hover:text-emerald-300 transition-all">{t}</span>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-center animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="relative w-full max-w-lg">
                <div className="aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-red-500/10 via-transparent to-emerald-500/10 p-8 backdrop-blur-sm hover:border-white/20 transition-all duration-500">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-neutral-400"><Activity className="h-4 w-4 text-emerald-400" /> Telemetría de Impacto (IMU)</div><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /></div>
                    <div className="text-center py-4"><div className="text-5xl font-bold font-mono gradient-text-red">1.0<span className="text-2xl text-neutral-500">G</span></div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mt-1">Fuerza G en reposo</div></div>
                    <ul className="space-y-2 text-xs text-neutral-400">
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Sensor MPU-6050 con muestreo de 1 kHz</li>
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Acelerómetro calibrado en ±16g</li>
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Bluetooth HC-05 + App React Native</li>
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Diagnóstico con Gemini AI</li>
                    </ul>
                    <div className="mt-auto rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-300 flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Sistema operando · 99.9% uptime</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-red-500/20 blur-[60px] animate-pulse" />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-500/15 blur-[50px]" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-600 animate-bounce">
          <span className="text-[10px] uppercase tracking-[0.3em]">Desplázate</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </section>

      {/* ── Problemática ── */}
      <section className="py-20 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 text-xs text-red-300 mb-4">Identificación del Problema</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">En México, los accidentes de motocicleta <span className="gradient-text-red">presentan un crecimiento crítico.</span></h2>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">El factor determinante entre la vida y la muerte es el tiempo de respuesta inicial. La automatización de la alerta puede reducir el tiempo de auxilio en un 40%.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              { icon: TrendingUp, label: "Aumento Anual", value: "+20%", desc: "de accidentes de moto por año", color: "text-red-400" },
              { icon: Zap, label: "Transmisión", value: "~4s", desc: "de detección a alerta emitida", color: "text-emerald-400" },
              { icon: Shield, label: "Respuesta", value: "-40%", desc: "reducción en tiempo de auxilio", color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center hover-lift group transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
                <s.icon className={`h-8 w-8 ${s.color} mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`} />
                <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-sm font-medium text-neutral-300 mt-1">{s.label}</div>
                <div className="text-xs text-neutral-500 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-bold text-lg mb-3">Problema que resuelve</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-3">Existe una alta cantidad de accidentes de tránsito, especialmente en motociclistas. Un gran porcentaje de las víctimas no recibe atención a tiempo.</p>
              <ul className="space-y-1.5 text-sm text-neutral-300">
                {["No hay testigos", "El accidentado queda inconsciente", "No se reporta el incidente", "No hay información técnica para servicios de emergencia"].map(item => (
                  <li key={item} className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-bold text-lg mb-3">Solución</h3>
              <ul className="space-y-3">
                {[
                  { icon: Gauge, text: "Detecta impactos mediante sensores" },
                  { icon: Brain, text: "Analiza la gravedad usando inteligencia artificial" },
                  { icon: MapPin, text: "Envía alertas inmediatas con ubicación GPS" },
                  { icon: Bell, text: "Notifica a contactos de emergencia y sistemas de control" },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-2 text-sm text-neutral-300">
                    <item.icon className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />{item.text}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-neutral-500 mt-3 italic">No requiere intervención del usuario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Características ── */}
      <section className="py-20 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Características del sistema</h2>
            <p className="mt-3 text-neutral-400">Hardware y software diseñados para máxima confiabilidad en escenarios críticos.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Cpu, title: "MCU Brain", desc: "Arduino Nano (ATmega328P). Controlador de bajo consumo que integra la lógica de detección y gestión." },
              { icon: Activity, title: "Sensor MPU-6050", desc: "Acelerómetro de 3 ejes + Giroscopio. Mide la aceleración inercial para detectar el impacto exacto en milisegundos." },
              { icon: Bluetooth, title: "Radio HC-05", desc: "Protocolo UART Bluetooth. Enlace estable para el envío de señales críticas al dispositivo de respuesta." },
              { icon: Shield, title: "Case PETG", desc: "Carcasa protectora resistente a la tracción, vibraciones y temperaturas extremas del entorno vial." },
              { icon: Smartphone, title: "App Móvil", desc: "Interfaz de respuesta rápida. Gestiona geolocalización, contacto de emergencia y telemetría en vivo." },
              { icon: Battery, title: "Power Unit", desc: "Gestión de energía Li-Po con protección contra cortocircuitos y más de 48 horas de autonomía." },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-5 transition-all duration-300 hover-lift hover:border-white/20 group">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-all duration-300"><f.icon className="h-4.5 w-4.5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" /></div>
                <h3 className="font-bold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video Demostrativo ── */}
      <section ref={videoSectionRef} className="py-20 relative border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Video demostrativo</h2>
            <p className="mt-3 text-neutral-400">Mira cómo funciona C.R.A.S.H. en acción.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline preload="metadata" loop onError={() => setVideoError(true)}>
              <source src={DEMO_VIDEO_SRC} type="video/mp4" />
            </video>
            {videoError && <div className="text-center py-8 text-neutral-500 text-sm">El video no está disponible momentáneamente.</div>}
          </div>
        </div>
      </section>

      {/* ── Proyecto info ── */}
      <section className="py-20 relative border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Sobre el proyecto</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-bold text-lg mb-3">Mercado objetivo</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Usuarios principales: motociclistas, repartidores (Uber Eats, DiDi, Rappi) y personas que usan motocicleta diariamente.</p>
              <p className="text-neutral-400 text-sm mt-2">Cliente potencial: repartidor independiente con largas jornadas, alto riesgo y dependencia de su salud para generar ingresos.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-bold text-lg mb-3">Modelo de negocio</h3>
              <p className="text-neutral-200 text-sm">B2C: dispositivo $1,499 MXN + suscripción $49 MXN/mes.</p>
              <p className="text-neutral-200 text-sm mt-1">B2B: dispositivo $1,999 MXN + suscripción $150 MXN/usuario/mes.</p>
              <p className="text-neutral-400 text-sm mt-2">Incluye monitoreo, análisis de datos y prevención de riesgos.</p>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-bold text-white mb-2">Costos</h3><p className="text-neutral-400 text-sm">Producción por unidad: ~$800 MXN.</p><p className="text-neutral-400 text-sm">Gastos operativos mensuales: ~$1,300 MXN.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-bold text-white mb-2">Modelo de ingresos</h3><ul className="list-disc list-inside text-neutral-400 text-sm space-y-1"><li>Venta del dispositivo</li><li>Suscripciones mensuales</li><li>Servicios adicionales para empresas</li><li>Integraciones personalizadas</li></ul></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-bold text-white mb-2">Oportunidad de negocio</h3><ul className="list-disc list-inside text-neutral-400 text-sm space-y-1"><li>Crecimiento del uso de motocicletas</li><li>Alta demanda del sector reparto</li><li>Necesidad de reducir accidentes</li><li>Mercado amplio y en expansión</li></ul></div>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-bold text-white mb-2">Normatividad</h3><p className="text-neutral-400 text-sm">Cumple con normas de seguridad en cascos, dispositivos electrónicos, seguridad laboral y protección de datos personales.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-bold text-white mb-2">Desarrollo</h3><p className="text-neutral-400 text-sm">Metodología Scrum: análisis, diseño, desarrollo e implementación con pruebas funcionales. C.R.A.S.H. automatiza la detección de accidentes y la solicitud de ayuda.</p></div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="py-20 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Arquitectura del sistema</h2>
            <p className="mt-3 text-neutral-400">Protocolos de comunicación y algoritmo de detección.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Layers, title: "1. Bus I2C", desc: "Síncrono — Lectura de registros del sensor MPU a través de SDA y SCL con manejo de colisiones." },
              { icon: Radio, title: "2. UART Serial", desc: "Asíncrono — Transmisión TX/RX para Bluetooth a 9600 bps." },
              { icon: Microscope, title: "3. Algoritmo de Detección", desc: "Cálculo de magnitud vectorial (G) en Arduino Nano para clasificar impactos." },
              { icon: Brain, title: "4. IA Generativa", desc: "Gemini AI analiza la telemetría y genera reporte predictivo de lesiones." },
            ].map(s => (
              <div key={s.title} className="text-center p-5 group transition-all duration-300">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-emerald-500/10 border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-red-500/30 transition-all duration-300"><s.icon className="h-6 w-6 text-red-400 group-hover:text-red-300 transition-colors duration-300" /></div>
                <h3 className="font-bold text-base mb-1.5">{s.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CrashLogo className="h-7 w-7" />
              <div><div className="text-sm font-bold">C.R.A.S.H.</div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Critical Response Alert System for Helmets</div></div>
            </div>
            <div className="flex items-center gap-6 text-xs text-neutral-500">
              <span>© 2026 C.R.A.S.H.</span>
              <span>InnovaTec 2026</span>
              <span>Hecho en México</span>
            </div>
          </div>
        </div>
      </footer>

      {showPlans && <PlansModal onClose={() => setShowPlans(false)} />}
      {showTokenGate && <TokenGateModal onClose={() => setShowTokenGate(false)} />}
    </div>
  );
}

export default memo(Landing);
