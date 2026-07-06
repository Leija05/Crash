import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Lock, Mail, Loader2 } from "lucide-react";

function CrashLogo() {
  return (
    <svg viewBox="0 0 333 306" className="h-9 w-9 text-red-500" aria-hidden="true">
      <g transform="translate(0,306) scale(0.1,-0.1)" fill="currentColor" stroke="none">

        <path d="M1535 2895 c-44 -37 -295 -160 -407 -199 -179 -64 -366 -107 -573
-131 -212 -25 -202 -23 -208 -48 -3 -12 -11 -106 -18 -209 -10 -149 -10 -229
0 -390 7 -111 16 -209 20 -216 5 -9 14 2 26 35 17 42 19 72 16 255 -4 260 7
464 25 482 7 8 44 17 81 20 104 11 285 44 413 76 203 51 360 112 548 210 118
62 144 69 177 47 44 -30 176 -97 275 -140 216 -93 459 -156 743 -191 60 -8
114 -19 120 -25 8 -8 12 -111 14 -325 2 -264 5 -320 19 -355 9 -22 20 -41 24
-41 9 0 17 67 26 215 5 106 -10 504 -22 552 -7 27 -2 26 -199 48 -371 41 -727
157 -981 320 -64 41 -79 42 -119 10z"/>
        <path d="M1359 2575 c-248 -52 -437 -152 -595 -317 -67 -70 -99 -117 -156
-228 -38 -76 -47 -110 -27 -110 26 0 49 24 73 76 81 176 282 362 489 452 182
78 398 108 604 82 375 -46 684 -248 810 -528 34 -76 42 -85 59 -71 20 16 17
52 -8 107 -75 163 -192 284 -388 399 -253 149 -567 199 -861 138z"/>
        <path d="M1240 2252 c-34 -70 -89 -188 -122 -262 -63 -142 -81 -171 -97 -155
-6 6 -29 66 -53 134 -24 69 -48 126 -54 128 -5 2 -38 -54 -74 -125 l-65 -127
-95 -6 c-117 -7 -170 -31 -199 -93 -29 -61 -59 -222 -71 -387 -18 -240 14
-581 66 -705 26 -61 100 -171 157 -231 106 -113 141 -112 332 7 178 110 577
282 837 360 115 34 400 100 433 100 6 0 16 -4 24 -9 19 -12 -27 -68 -137 -163
-162 -141 -283 -223 -449 -305 -29 -14 -53 -29 -53 -34 0 -51 269 96 465 254
199 161 435 451 398 488 -19 19 -39 4 -78 -56 -53 -80 -90 -97 -295 -139 -433
-88 -813 -231 -1167 -440 -108 -63 -137 -76 -173 -76 -40 0 -48 5 -89 49 -88
93 -164 248 -185 377 -9 50 -3 56 89 78 467 114 757 221 872 321 60 52 132
162 140 212 5 32 4 35 -18 31 -17 -2 -33 -20 -56 -63 -47 -86 -132 -163 -234
-212 -187 -92 -773 -263 -801 -235 -35 35 -34 375 2 587 35 204 45 216 206
221 58 2 110 7 115 10 5 3 25 36 44 74 54 107 51 109 115 -80 23 -69 46 -129
51 -135 6 -5 16 9 26 35 54 136 202 445 214 445 19 0 26 -44 40 -244 9 -123
17 -175 26 -178 7 -3 59 22 115 56 56 34 107 61 115 61 21 0 16 -24 -27 -119
-22 -49 -40 -96 -40 -105 0 -14 20 -16 165 -16 195 0 192 1 225 -112 12 -40
37 -127 56 -193 20 -66 40 -133 46 -148 15 -38 39 -50 65 -32 27 19 41 80 128
582 27 156 52 263 65 277 14 14 49 -119 160 -599 12 -49 28 -100 36 -112 18
-28 59 -30 73 -4 6 10 30 94 55 187 64 242 80 289 96 289 8 0 26 -31 43 -75
45 -120 76 -143 214 -155 129 -12 193 6 177 50 -5 12 -29 15 -126 15 -162 0
-163 1 -222 142 -97 229 -114 216 -225 -185 -17 -59 -33 -112 -36 -118 -12
-19 -33 11 -45 64 -28 126 -144 597 -158 646 -19 62 -43 84 -66 61 -14 -14
-28 -79 -92 -425 -85 -463 -101 -514 -130 -420 -7 22 -27 87 -45 145 -17 58
-40 117 -51 132 -26 37 -72 49 -180 48 -127 -2 -125 -2 -131 15 -6 13 40 135
97 257 14 31 26 59 26 62 0 13 -24 4 -63 -22 -23 -16 -91 -57 -151 -92 -103
-59 -110 -62 -123 -44 -7 10 -13 32 -13 48 0 113 -38 504 -50 511 -4 2 -35
-53 -70 -123z"/>
        <path d="M600 1654 c-48 -124 -66 -574 -24 -574 11 0 14 26 14 138 0 121 14
250 46 425 5 30 4 37 -10 37 -9 0 -21 -12 -26 -26z"/>
        <path d="M2715 1431 c-3 -5 -21 -63 -41 -127 -118 -388 -359 -682 -755 -921
-125 -75 -293 -153 -329 -153 -33 0 -186 72 -312 147 -92 54 -111 62 -129 53
-11 -6 -19 -17 -16 -23 10 -32 270 -185 398 -236 l57 -22 76 31 c42 18 122 56
177 86 371 199 630 446 786 752 60 117 149 363 139 388 -7 18 -43 36 -51 25z"/>
        <path d="M805 785 c-38 -14 -112 -81 -101 -92 3 -3 19 6 36 20 41 35 95 49
143 37 48 -10 69 -29 92 -81 23 -50 51 -50 48 0 -4 82 -127 148 -218 116z"/>
      </g>
    </svg>
  );
}

export default function Login() {
  const { user, login, error } = useAuth();
  const [email, setEmail] = useState("admin@crash.io");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (ok) navigate("/");
  };

  return (
    <div
      className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-5 bg-[#0A0A0A] text-white"
      data-testid="login-page"
    >
      {/* LEFT — brand panel */}
      <aside className="hidden lg:flex lg:col-span-3 relative overflow-hidden border-r border-white/5">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=2000&q=80)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
        <div className="absolute inset-0 grid-grain opacity-30" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)]">
              <CrashLogo />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
                Critical Response
              </div>
              <div className="text-lg font-bold tracking-tight">C.R.A.S.H.</div>
            </div>
          </div>

          <div className="max-w-md">
            <div className="text-[11px] uppercase tracking-[0.3em] text-emerald-40bg-red-500/15 mb-4">
              Command Center · Live
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
              Supervisión de telemetría<br />
              de cascos en <span className="text-red-400">tiempo real</span>.
            </h1>
            <p className="mt-6 text-neutral-400 max-w-sm leading-relaxed">
              Mapa en vivo, fuerza-G, conexión Bluetooth y respuesta inmediata
              ante impactos. Diseñado para operadores de seguridad vial.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { v: "8", l: "Conductores" },
                { v: "<2s", l: "Latencia" },
                { v: "24/7", l: "Monitoreo" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                  <div className="font-mono text-2xl font-bold text-white">{s.v}</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
            // Encrypted channel · TLS 1.3 · Session JWT
          </div>
        </div>
      </aside>

      {/* RIGHT — form */}
      <main className="lg:col-span-2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.28)]">
              <CrashLogo />
            </div>
            <div className="font-bold text-lg">C.R.A.S.H.</div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-500 mb-3">
            Acceso de operador
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Iniciar sesión</h2>
          <p className="text-neutral-400 text-sm mb-10">
            Ingresa con tus credenciales de administrador o monitorista.
          </p>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">
                Correo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  data-testid="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 focus:bg-white/10 outline-none rounded-xl pl-10 pr-3 py-3 text-sm transition-all"
                  placeholder="operador@crash.io"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  data-testid="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 focus:bg-white/10 outline-none rounded-xl pl-10 pr-3 py-3 text-sm transition-all"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error ? (
              <div
                data-testid="login-error"
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3"
              >
                {error}
              </div>
            ) : null}

            <button
              data-testid="login-submit"
              disabled={busy}
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Verificando…" : "Acceder al Centro de Mando"}
            </button>
          </form>

          <div className="mt-10 grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 font-mono">
              <div className="uppercase tracking-[0.2em] text-neutral-500 text-[9px] mb-1">Admin</div>
              admin@crash.io<br />admin123
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 font-mono">
              <div className="uppercase tracking-[0.2em] text-neutral-500 text-[9px] mb-1">Monitor</div>
              monitor@crash.io<br />monitor123
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
