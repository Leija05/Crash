import { memo, useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { api, formatApiError } from "../lib/api";
import {
  ShieldCheck, Key, CheckCircle2, ArrowLeft, Eye, EyeOff, Lock, Mail, LogIn, AlertCircle,
} from "lucide-react";
import { useI18n } from "../i18n";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

function TokenGate({ onVerified }) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  const { t } = useI18n();

  const submitToken = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/auth/verify-site-token", { token: tokenInput.trim() }, { __authProbe: true });
      setTokenInfo(data);
      localStorage.setItem("crash_site_token", tokenInput.trim());
      setVerified(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const clearAndRetry = () => {
    localStorage.removeItem("crash_site_token");
    setVerified(false);
    setTokenInfo(null);
    setTokenInput("");
  };

  const role = tokenInfo?.role;

  if (verified) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <motion.div variants={stagger} initial="initial" animate="animate" className="w-full max-w-md relative">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} className="text-red-500" />
            </div>
            <div>
              <span className="font-bold font-mono text-xl tracking-tight text-white block">C.R.A.S.H<span className="text-red-500">.</span></span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">{t("loginPage.tokenVerified", "Token Verificado")}</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="card-glass-strong p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role === "superadmin" ? "bg-red-500/10" : role === "empresa" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                <CheckCircle2 size={18} className={role === "superadmin" ? "text-red-400" : role === "empresa" ? "text-amber-400" : "text-emerald-400"} />
              </div>
              <div>
                <h2 className="font-bold font-mono text-lg">{tokenInfo?.company_name || tokenInfo?.email || t("loginPage.tokenVerifiedDefault", "Token verificado")}</h2>
                <p className="text-zinc-500 text-xs">
                  {role === "superadmin" ? t("loginPage.accessSuperadminValidated", "Acceso de SuperAdministrador validado") : role === "empresa" ? t("loginPage.accessCompanyValidated", "Token de empresa validado") : t("loginPage.accessMonitorValidated", "Token de monitorista validado correctamente")}
                </p>
              </div>
            </div>

            <motion.div variants={fadeUp} className={`text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg self-start inline-flex ${role === "superadmin" ? "bg-red-500/10 text-red-300" : role === "empresa" ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}>
              {role === "superadmin" ? t("loginPage.roleSuperadmin", "SuperAdmin") : role === "empresa" ? t("loginPage.roleCompany", "Empresa") : t("loginPage.roleMonitor", "Monitorista")}
            </motion.div>

            <motion.div variants={fadeUp}>
              {role === "empresa" ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
                  <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-1">
                    <AlertCircle size={16} /> {t("loginPage.companyTokenTitle", "Token de empresa")}
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    {t("loginPage.companyTokenIntro", "Este token te permitira ")}<b className="text-white">crear</b>{t("loginPage.companyTokenMid", " tu cuenta de monitorista (o vincular una existente) asociada a ")}<b className="text-white">{tokenInfo?.company_name || t("loginPage.yourCompany", "tu empresa")}</b>{t("loginPage.companyTokenEnd", ". Al iniciar sesion solo veras los conductores de esa empresa.")}
                  </p>
                  <div className="text-[11px] text-zinc-500 mt-2">{t("loginPage.uses", "Usos: ")}{tokenInfo?.use_count || 0} / {tokenInfo?.max_uses || 0}</div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-1">
                  {role === "superadmin" ? t("loginPage.continueToAdmin", "Continua para entrar al panel de administracion.") : t("loginPage.continueToMonitor", "Continua para iniciar sesion en el monitoreo.")}
                </p>
              )}
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex items-center gap-2 pt-2">
              <motion.button onClick={() => onVerified(role === "empresa" ? "monitor" : role, tokenInfo)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-zinc-200 transition-all text-sm">
                {role === "empresa" ? t("loginPage.continueManageCompany", "Continuar y gestionar mi empresa") : t("loginPage.continueToLogin", "Continuar al inicio de sesion")}
              </motion.button>
              <motion.button onClick={clearAndRetry} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs border border-zinc-700/50 transition-all">
                {t("loginPage.useAnotherToken", "Usar otro token")}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="absolute top-6 left-6">
        <Link to="/" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors group">
          <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
            <ArrowLeft size={14} />
          </div>
        </Link>
      </motion.div>
      <motion.div variants={stagger} initial="initial" animate="animate" className="w-full max-w-sm relative">
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
            <ShieldCheck size={24} className="text-black" />
          </div>
          <div>
            <span className="font-bold font-mono text-xl tracking-tight text-white block">C.R.A.S.H<span className="text-red-500">.</span></span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">{t("loginPage.monitorAccess", "Acceso Monitorista")}</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card-glass-strong p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Key size={18} className="text-red-500" />
            </div>
            <div>
              <h1 className="font-bold font-mono text-lg tracking-tight">{t("loginPage.accessToken", "Token de Acceso")}</h1>
              <p className="text-zinc-500 text-xs">{t("loginPage.enterTokenPrompt", "Ingresa el token proporcionado por tu proveedor.")}</p>
            </div>
          </div>

          <form onSubmit={submitToken} className="space-y-4">
            <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">{t("loginPage.uniqueToken", "Token unico")}</label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
                className="w-full bg-[#0d0d0d] border border-white/10 focus:border-white/30 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-all font-mono text-center tracking-widest"
              />
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2.5 flex items-center gap-2 overflow-hidden">
                  <span className="text-red-400 text-xs">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              type="submit"
              disabled={busy || !tokenInput.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {t("loginPage.verifying", "Verificando...")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {t("loginPage.validateAccess", "Validar acceso")}
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p variants={fadeUp} className="text-zinc-700 text-xs mt-6 font-mono text-center">
          Este token se solicita una unica vez por dispositivo.
        </motion.p>
      </motion.div>
    </div>
  );
}

function LoginForm({ token, role, initialEmail = "" }) {
  const { login, loginWithToken, loginSuperAdmin, associateMonitor } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [remember, setRemember] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      let ok = false;
      if (role === "superadmin") {
        ok = await loginSuperAdmin(email, password, remember);
        if (ok) window.location.href = "/admin";
      } else if (registerMode) {
        ok = await loginWithToken(token, email, password, name, remember);
        if (ok) navigate("/dashboard");
      } else {
        ok = await login(email, password, remember);
        if (ok) {
          // Si ingresamos el token de empresa y ya teniamos cuenta, asociarla.
          const pending = localStorage.getItem("crash_site_token");
          if (pending) {
            try { await associateMonitor(pending); } catch { /* ya asociada o no aplica */ }
          }
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="absolute top-6 left-6">
        <Link to="/" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors group">
          <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
            <ArrowLeft size={14} />
          </div>
        </Link>
      </motion.div>
      <motion.div variants={stagger} initial="initial" animate="animate" className="w-full max-w-sm relative">
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
            <ShieldCheck size={24} className="text-black" />
          </div>
          <div>
            <span className="font-bold font-mono text-xl tracking-tight text-white block">C.R.A.S.H<span className="text-red-500">.</span></span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">{role === "superadmin" ? t("loginPage.adminCenter", "Centro de Admin") : t("loginPage.controlCenter", "Centro de Control")}</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card-glass-strong p-6 rounded-2xl">
          <motion.h1 variants={fadeUp} className="font-bold font-mono text-2xl tracking-tight mb-1">{t("loginPage.welcome", "Bienvenido")}</motion.h1>
          <motion.p variants={fadeUp} className="text-zinc-500 text-sm mb-6">{role === "superadmin" ? t("loginPage.exclusiveSuperadmin", "Acceso exclusivo para SuperAdministrador.") : t("loginPage.exclusiveMonitor", "Acceso exclusivo para monitoristas autorizados.")}</motion.p>

          <form onSubmit={submit} className="space-y-4">
            <AnimatePresence>
              {registerMode && role !== "superadmin" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">{t("loginPage.fullName", "Nombre completo")}</label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={t("loginPage.monitorNamePlaceholder", "Nombre del monitor")}
                      className="w-full bg-[#0d0d0d] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none transition-all font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div variants={fadeUp}>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">{t("loginPage.email", "Correo electronico")}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly={role === "superadmin"}
                  placeholder="correo@ejemplo.com"
                  className={`w-full bg-[#0d0d0d] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none transition-all font-mono ${role === "superadmin" ? "opacity-70 cursor-not-allowed" : ""}`}
                />
              </div>
              {role === "superadmin" && email && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-emerald-400/80 mt-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {t("loginPage.emailAutofilled", "Correo autocompletado desde tu token. Solo escribe tu contrasena.")}
                </motion.p>
              )}
            </motion.div>
            <motion.div variants={fadeUp}>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">{t("loginPage.password", "Contrasena")}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0d0d0d] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2.5 flex items-center gap-2 overflow-hidden">
                  <span className="text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div variants={fadeUp}>
              <label className="flex items-center gap-2.5 cursor-pointer select-none group pt-1">
                <span className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-4 w-4 rounded-[5px] border border-white/20 bg-[#0d0d0d] peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                    {remember && <CheckCircle2 size={12} className="text-black" />}
                  </span>
                </span>
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {t("loginPage.keepSession", "Mantener sesión iniciada en este dispositivo")}
                </span>
              </label>
            </motion.div>
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {t("loginPage.verifying", "Verificando...")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  {role === "superadmin" ? t("loginPage.enterPanel", "Entrar al panel") : registerMode ? t("loginPage.createAccount", "Crear cuenta y acceder") : t("loginPage.loginToPanel", "Ingresar al panel")}
                </span>
              )}
            </motion.button>
          </form>

          {role !== "superadmin" && (
            <motion.div variants={fadeUp} className="mt-5 text-center">
              <motion.button
                type="button"
                onClick={() => setRegisterMode((m) => !m)}
                whileHover={{ scale: 1.02 }}
                className="text-xs text-zinc-500 hover:text-emerald-300 transition-colors"
              >
                {registerMode ? t("loginPage.alreadyHaveAccount", "¿Ya tienes cuenta? Iniciar sesion") : t("loginPage.areYouNew", "¿Eres nuevo? Crear cuenta de monitorista")}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        <motion.p variants={fadeUp} className="text-zinc-700 text-xs mt-6 font-mono text-center flex items-center justify-center gap-1.5">
          <Lock size={12} /> {t("loginPage.encrypted", "Protegido por cifrado de extremo a extremo.")}
        </motion.p>
      </motion.div>
    </div>
  );
}

function Login() {
  const { user, initializing } = useAuth();
  const { t } = useI18n();
  const [gate, setGate] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("crash_site_token");
    if (!saved) return;
    let cancelled = false;
    setChecking(true);
    (async () => {
      try {
        const { data } = await api.post("/auth/verify-site-token", { token: saved }, { __authProbe: true });
        if (cancelled) return;
        // El token de empresa inicia el flujo de monitorista (se asocia a la empresa).
        if (data.role === "empresa") {
          setGate({ role: "monitor", email: "" });
          return;
        }
        setGate({ role: data.role, email: data.email || "" });
      } catch {
        if (!cancelled) localStorage.removeItem("crash_site_token");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm font-mono">{t("loginPage.restoringSession", "Restaurando sesión...")}</span>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === "superadmin") return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm font-mono">{t("loginPage.restoringAccess", "Restaurando acceso...")}</span>
        </div>
      </div>
    );
  }

  if (!gate) {
    return <TokenGate onVerified={(role, info) => setGate({ role, email: info?.email || "" })} />;
  }

  return <LoginForm token={localStorage.getItem("crash_site_token") || ""} role={gate.role} initialEmail={gate.email} />;
}

export default memo(Login);
