import { memo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, formatApiError } from "../lib/api";
import {
  ShieldCheck, Key, CheckCircle2, ArrowLeft, Eye, EyeOff, Lock, Mail, LogIn, AlertCircle,
} from "lucide-react";

function TokenGate({ onVerified }) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  const submitToken = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/auth/verify-site-token", { token: tokenInput.trim() });
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
        <div className="w-full max-w-md relative fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} className="text-red-500" />
            </div>
            <div>
              <span className="font-bold font-mono text-xl tracking-tight text-white block">C.R.A.S.H<span className="text-red-500">.</span></span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">Token Verificado</span>
            </div>
          </div>

          <div className="card-glass-strong p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role === "superadmin" ? "bg-red-500/10" : role === "empresa" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                <CheckCircle2 size={18} className={role === "superadmin" ? "text-red-400" : role === "empresa" ? "text-amber-400" : "text-emerald-400"} />
              </div>
              <div>
                <h2 className="font-bold font-mono text-lg">{tokenInfo?.company_name || tokenInfo?.email || "Token verificado"}</h2>
                <p className="text-zinc-500 text-xs">
                  {role === "superadmin" ? "Acceso de SuperAdministrador validado" : role === "empresa" ? "Token de empresa validado" : "Token de monitorista validado correctamente"}
                </p>
              </div>
            </div>

            <div className={`text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg self-start inline-flex ${role === "superadmin" ? "bg-red-500/10 text-red-300" : role === "empresa" ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}>
              {role === "superadmin" ? "SuperAdmin" : role === "empresa" ? "Empresa" : "Monitorista"}
            </div>

            {role === "empresa" ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-1">
                  <AlertCircle size={16} /> Token de empresa
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Este token te permitira <b className="text-white">crear</b> tu cuenta de monitorista (o vincular una existente) asociada a <b className="text-white">{tokenInfo?.company_name || "tu empresa"}</b>. Al iniciar sesion solo veras los conductores de esa empresa.
                </p>
                <div className="text-[11px] text-zinc-500 mt-2">Usos: {tokenInfo?.use_count || 0} / {tokenInfo?.max_uses || 0}</div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-1">
                {role === "superadmin" ? "Continua para entrar al panel de administracion." : "Continua para iniciar sesion en el monitoreo."}
              </p>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => onVerified(role === "empresa" ? "monitor" : role, tokenInfo)} className="flex-1 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-zinc-200 transition-all text-sm">
                {role === "empresa" ? "Continuar y gestionar mi empresa" : "Continuar al inicio de sesion"}
              </button>
              <button onClick={clearAndRetry} className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs border border-zinc-700/50 transition-all">
                Usar otro token
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <Link to="/" className="absolute top-6 left-6 text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors group">
        <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
          <ArrowLeft size={14} />
        </div>
      </Link>
      <div className="w-full max-w-sm relative fade-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
            <ShieldCheck size={24} className="text-black" />
          </div>
          <div>
            <span className="font-bold font-mono text-xl tracking-tight text-white block">C.R.A.S.H<span className="text-red-500">.</span></span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">Acceso Monitorista</span>
          </div>
        </div>

        <div className="card-glass-strong p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Key size={18} className="text-red-500" />
            </div>
            <div>
              <h1 className="font-bold font-mono text-lg tracking-tight">Token de Acceso</h1>
              <p className="text-zinc-500 text-xs">Ingresa el token proporcionado por tu proveedor.</p>
            </div>
          </div>

          <form onSubmit={submitToken} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">Token unico</label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
                className="w-full bg-[#0d0d0d] border border-white/10 focus:border-white/30 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-all font-mono text-center tracking-widest"
              />
            </div>
            {error && (
              <div className="text-sm border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="text-red-400 text-xs">{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={busy || !tokenInput.trim()}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Validar acceso
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-zinc-700 text-xs mt-6 font-mono text-center">
          Este token se solicita una unica vez por dispositivo.
        </p>
      </div>
    </div>
  );
}

function LoginForm({ token, role, initialEmail = "" }) {
  const { login, loginWithToken, loginSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      let ok = false;
      if (role === "superadmin") {
        ok = await loginSuperAdmin(email, password);
        if (ok) window.location.href = "/admin";
      } else if (registerMode) {
        ok = await loginWithToken(token, email, password, name);
        if (ok) navigate("/dashboard");
      } else {
        ok = await login(email, password);
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
      <Link to="/" className="absolute top-6 left-6 text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors group">
        <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
          <ArrowLeft size={14} />
        </div>
      </Link>
      <div className="w-full max-w-sm relative fade-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
            <ShieldCheck size={24} className="text-black" />
          </div>
          <div>
            <span className="font-bold font-mono text-xl tracking-tight text-white block">C.R.A.S.H<span className="text-red-500">.</span></span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">{role === "superadmin" ? "Centro de Admin" : "Centro de Control"}</span>
          </div>
        </div>

        <div className="card-glass-strong p-6 rounded-2xl">
          <h1 className="font-bold font-mono text-2xl tracking-tight mb-1">Bienvenido</h1>
          <p className="text-zinc-500 text-sm mb-6">{role === "superadmin" ? "Acceso exclusivo para SuperAdministrador." : "Acceso exclusivo para monitoristas autorizados."}</p>

          <form onSubmit={submit} className="space-y-4">
            {registerMode && role !== "superadmin" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">Nombre completo</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nombre del monitor"
                    className="w-full bg-[#0d0d0d] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none transition-all font-mono"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">Correo electronico</label>
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
                <p className="text-[11px] text-emerald-400/80 mt-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Correo autocompletado desde tu token. Solo escribe tu contrasena.
                </p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">Contrasena</label>
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
            </div>
            {error && (
              <div className="text-sm border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="text-red-400">{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  {role === "superadmin" ? "Entrar al panel" : registerMode ? "Crear cuenta y acceder" : "Ingresar al panel"}
                </span>
              )}
            </button>
          </form>

          {role !== "superadmin" && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setRegisterMode((m) => !m)}
                className="text-xs text-zinc-500 hover:text-emerald-300 transition-colors"
              >
                {registerMode ? "¿Ya tienes cuenta? Iniciar sesion" : "¿Eres nuevo? Crear cuenta de monitorista"}
              </button>
            </div>
          )}
        </div>

        <p className="text-zinc-700 text-xs mt-6 font-mono text-center flex items-center justify-center gap-1.5">
          <Lock size={12} /> Protegido por cifrado de extremo a extremo.
        </p>
      </div>
    </div>
  );
}

function Login() {
  const { user } = useAuth();
  const [gate, setGate] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("crash_site_token");
    if (!saved) return;
    let cancelled = false;
    setChecking(true);
    (async () => {
      try {
        const { data } = await api.post("/auth/verify-site-token", { token: saved });
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

  if (user) {
    if (user.role === "superadmin") return <Link to="/admin" />;
    return <Link to="/dashboard" />;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm font-mono">Restaurando acceso...</span>
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
