import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Activity, Gauge, Bell, MapPin, Brain, ChevronRight, Check, X,
  CreditCard, Building2, Users, Wifi, HardDrive, Zap, Settings, Smartphone,
  Globe, Truck, Lock, ArrowRight, Menu, Star, Loader2, ShoppingCart,
  Info, Monitor, ExternalLink, Clock, AlertTriangle, Key, Mail, UserPlus,
} from "lucide-react";
import { api, formatApiError } from "../lib/api";

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
      try {
        const { data } = await api.get("/plans");
        setPlans(data);
      } catch { setPlans([]); }
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
            <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Próximamente</h3>
            <p className="text-neutral-400 max-w-sm mx-auto mb-6">
              El sistema de compras en línea está en desarrollo. Mientras tanto, contacta al SuperAdmin para activar tu plan.
            </p>
            <button onClick={onClose} className="border border-white/20 hover:border-white/40 rounded-xl px-6 py-2.5 text-sm transition-all">Cerrar</button>
          </div>
        ) : selectedPlan ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">{selectedPlan.name} seleccionado</h3>
            <p className="text-neutral-400 mb-4">${selectedPlan.price}/mes — {selectedPlan.max_drivers} conductores</p>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300 max-w-md mx-auto mb-6">
              <Clock className="h-4 w-4 inline-block mr-2" />
              El proceso de pago está en desarrollo. Pronto podrás completar la compra.
            </div>
            <button onClick={() => setSelectedPlan(null)} className="border border-white/20 hover:border-white/40 rounded-xl px-6 py-2.5 text-sm transition-all">Volver a planes</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              {display.map((plan) => (
                <div key={plan.name} className={`relative rounded-2xl border p-5 transition-all hover-lift ${plan.popular ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "border-white/10 bg-white/[0.03]"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">Más popular</div>
                  )}
                  <div className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-neutral-500 text-sm">/mes</span>
                  </div>
                  <div className="text-xs text-neutral-400 mb-4">Hasta {plan.max_drivers} conductores</div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-neutral-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setSelectedPlan(plan)} className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${plan.popular ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "border border-white/20 hover:border-white/40 text-white"}`}>
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-neutral-500 mt-6">
              ¿Necesitas más conductores? <button onClick={() => setShowComingSoon(true)} className="text-emerald-400 hover:underline">Contacta a ventas</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TokenGateModal({ onClose }) {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [step, setStep] = useState("token"); // token | register | login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const verifyToken = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-site-token", { token });
      setTokenInfo(data);
      localStorage.setItem("crash_site_token", token);
      setStep("register");
    } catch (err) {
      setError(formatApiError(err));
    }
    setBusy(false);
  }, [token]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register-monitor", { token, email, password, name });
      if (data.access_token) localStorage.setItem("crash_token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err));
    }
    setBusy(false);
  }, [token, email, password, name, navigate]);

  const handleDirectLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><X className="h-4 w-4" /></button>

        {step === "token" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><Key className="h-5 w-5 text-emerald-400" /></div>
              <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Acceso monitoristas</div><div className="font-bold">Token de empresa</div></div>
            </div>
            <p className="text-sm text-neutral-400 mb-5">Ingresa el token único que tu empresa te proporcionó.</p>
            <div className="relative mb-4">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input value={token} onChange={e => setToken(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl pl-10 pr-3 py-3 text-sm font-mono tracking-wider outline-none transition-all" placeholder="XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">{error}</div>}
            <button disabled={busy || token.length < 8} onClick={verifyToken} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2 mb-3">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Verificando..." : "Verificar token"}
            </button>
            <div className="text-center">
              <button onClick={handleDirectLogin} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">¿Ya tienes cuenta? Inicia sesión</button>
            </div>
          </>
        )}

        {step === "register" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><UserPlus className="h-5 w-5 text-emerald-400" /></div>
              <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Registro</div><div className="font-bold">Crear cuenta</div></div>
            </div>
            {tokenInfo && (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {tokenInfo.company_name} · Plan {tokenInfo.plan_name}
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Nombre</label>
                <div className="relative">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none transition-all" placeholder="Tu nombre" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none transition-all" placeholder="monitorista@correo.com" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none transition-all" required />
                </div>
              </div>
              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</div>}
              <button disabled={busy} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Creando cuenta..." : "Crear cuenta y acceder"}
              </button>
            </form>
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

  useEffect(() => {
    const handler = () => setScroll(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scroll > 20 ? "bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)]">
                <CrashLogo className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 leading-tight">Critical Response</div>
                <div className="text-lg font-bold tracking-tight leading-tight">C.R.A.S.H.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPlans(true)} className="inline-flex items-center gap-1.5 border border-white/20 hover:border-emerald-500/40 hover:text-emerald-300 text-sm rounded-xl px-4 py-2 transition-all">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Planes</span>
              </button>
              <button onClick={() => setShowTokenGate(true)} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl px-4 py-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Acceder a monitoreo</span>
                <span className="sm:hidden">Acceder</span>
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center">
                <Menu className="h-5 w-5" />
              </button>
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

      {/* ── Hero / Project Info ── */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 text-xs text-red-300 mb-6">
                <Activity className="h-3.5 w-3.5" />
                Monitoreo de cascos inteligentes en tiempo real
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                Seguridad vial con
                <span className="gradient-text-red block mt-2">inteligencia artificial</span>
              </h1>
              <p className="mt-6 text-lg text-neutral-400 max-w-xl leading-relaxed">
                C.R.A.S.H. — <strong>Critical Response Alert System for Helmets</strong>. 
                Detecta impactos en tiempo real, alerta a emergencias y proporciona 
                diagnóstico con IA para una respuesta inmediata. Diseñado para empresas 
                de mensajería, delivery y flotillas de motociclistas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => setShowTokenGate(true)} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl px-6 py-3 transition-all hover-lift shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  Acceder a monitoreo
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setShowPlans(true)} className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white rounded-xl px-6 py-3 transition-all hover-lift">
                  Ver planes
                  <CreditCard className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm">
                {[
                  { v: "8+", l: "Conductores simulados", c: "text-emerald-400" },
                  { v: "<2s", l: "Latencia en alertas", c: "text-emerald-400" },
                  { v: "24/7", l: "Monitoreo continuo", c: "text-red-400" },
                ].map(s => (
                  <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center hover-lift">
                    <div className={`font-mono text-xl font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* ── Tech stack badges ── */}
              <div className="mt-8 flex flex-wrap gap-2">
                {["React", "FastAPI", "MongoDB", "WebSocket", "Gemini IA", "React Native", "WhatsApp API"].map(t => (
                  <span key={t} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-neutral-400">{t}</span>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-center animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="relative w-full max-w-lg">
                <div className="aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-red-500/10 via-transparent to-emerald-500/10 p-8 backdrop-blur-sm">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-neutral-400"><Activity className="h-4 w-4 text-emerald-400" /> Panel de monitoreo</div>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    {[
                      { label: "Conductores en vivo", value: "08", color: "text-emerald-400" },
                      { label: "Alertas activas", value: "03", color: "text-red-400" },
                      { label: "Tiempo real", value: "WebSocket", color: "text-emerald-400" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                        <span className="text-xs text-neutral-500">{s.label}</span>
                        <span className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                    <ul className="space-y-2 text-xs text-neutral-400 mt-2">
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Detección de impacto G-Force</li>
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Notificaciones WhatsApp</li>
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Diagnóstico con IA</li>
                      <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Mapa interactivo en vivo</li>
                    </ul>
                    <div className="mt-auto rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-300 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" /> Sistema operando · 99.9% uptime
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-red-500/20 blur-[60px]" />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-500/15 blur-[50px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Todo lo que necesitas para monitorear</h2>
            <p className="mt-3 text-neutral-400">Detección de impacto, geolocalización, alertas automáticas y diagnóstico con IA en un solo sistema.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Activity, title: "Detección de Impactos", desc: "Sensor G-Force con umbrales configurables. Detecta colisiones en milisegundos." },
              { icon: MapPin, title: "Geolocalización en Vivo", desc: "Mapa interactivo con posición exacta. Historial de rutas y replay de accidentes." },
              { icon: Bell, title: "Alertas Inmediatas", desc: "Notificaciones en tiempo real vía WebSocket. Alertas a contactos por WhatsApp." },
              { icon: Brain, title: "Diagnóstico con IA", desc: "Análisis automático usando inteligencia artificial. Reportes detallados de severidad." },
              { icon: Gauge, title: "Telemetría Completa", desc: "Velocidad, aceleración, giroscopio y batería del casco en tiempo real." },
              { icon: Smartphone, title: "App Móvil Integrada", desc: "App para conductores con detección automática y telemetría en vivo." },
            ].map((f, i) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] p-5 transition-all hover-lift">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
                  <f.icon className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 relative bg-white/[0.01] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Empieza en minutos</h2>
            <p className="mt-3 text-neutral-400">Configuración simple, resultados inmediatos. No necesitas hardware especial.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Building2, title: "1. Registra tu empresa", desc: "El SuperAdmin crea tu empresa y te asigna un token de acceso único." },
              { icon: Users, title: "2. Invita a tu equipo", desc: "Comparte el token con tus monitoristas. Ellos crean su cuenta y acceden al panel." },
              { icon: Smartphone, title: "3. Conecta conductores", desc: "Los conductores descargan la app y se registran. Seleccionan tu empresa." },
              { icon: Activity, title: "4. Monitorea", desc: "Mapa en vivo, alertas instantáneas, telemetría y diagnóstico con IA." },
            ].map(s => (
              <div key={s.title} className="text-center p-5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-emerald-500/10 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <s.icon className="h-6 w-6 text-red-400" />
                </div>
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
              <div>
                <div className="text-sm font-bold">C.R.A.S.H.</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Critical Response Alert System for Helmets</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-neutral-500">
              <span>© 2026 C.R.A.S.H.</span>
              <span>Todos los derechos reservados</span>
              <span>Hecho en México</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {showPlans && <PlansModal onClose={() => setShowPlans(false)} />}
      {showTokenGate && <TokenGateModal onClose={() => setShowTokenGate(false)} />}
    </div>
  );
}

export default memo(Landing);
