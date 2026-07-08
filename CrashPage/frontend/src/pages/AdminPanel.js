import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, formatApiError } from "../lib/api";
import {
  LayoutDashboard, Building2, CreditCard, Users, Key, LogOut,
  Plus, Trash2, Edit3, Copy, RefreshCw, Loader2, Check, X,
  Search, ChevronDown, ChevronRight, Shield, Activity, Mail, Phone,
  AlertCircle, Settings, BarChart3, Clock, Globe, Smartphone, Eye,
} from "lucide-react";

function StatsCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${accent === "emerald" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : accent === "red" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-neutral-400"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  );
}

function CompanyModal({ company, onClose, onSaved }) {
  const [name, setName] = useState(company?.name || "");
  const [email, setEmail] = useState(company?.email || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [busy, setBusy] = useState(false);
  const isEdit = !!company;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) {
        await api.put(`/companies/${company.id}`, { name, email, phone });
      } else {
        await api.post("/companies", { name, email, phone });
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(formatApiError(err));
    }
    setBusy(false);
  }, [name, email, phone, isEdit, company, onClose, onSaved]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-400" /></div>
          <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">{isEdit ? "Editar" : "Nueva"} empresa</div><div className="font-bold">{isEdit ? "Editar " + company.name : "Registrar empresa"}</div></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Teléfono</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all" />
          </div>
          <button disabled={busy} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear empresa"}
          </button>
        </form>
      </div>
    </div>
  );
}

function TokenDisplay({ token, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [token]);
  if (!token) return null;
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 group">
      <Key className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
      <code className="font-mono text-xs text-emerald-300 tracking-wider flex-1 truncate">{token}</code>
      <button onClick={handleCopy} className="h-7 w-7 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0" title="Copiar">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
      </button>
      {onRegenerate && (
        <button onClick={() => { if (confirm("¿Regenerar token? Los monitoristas deberán usar el nuevo.")) onRegenerate(); }} className="h-7 w-7 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0" title="Regenerar">
          <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
        </button>
      )}
    </div>
  );
}

function CompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [monitors, setMonitors] = useState({});

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/companies");
      setCompanies(data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadMonitors = useCallback(async (companyId) => {
    try {
      const { data } = await api.get(`/companies/${companyId}/monitors`);
      setMonitors(prev => ({ ...prev, [companyId]: data }));
    } catch { }
  }, []);

  const toggleExpand = useCallback((id) => {
    const isNow = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: isNow }));
    if (isNow && !monitors[id]) loadMonitors(id);
  }, [expanded, monitors, loadMonitors]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm("¿Eliminar empresa y todos sus monitoristas?")) return;
    try {
      await api.delete(`/companies/${id}`);
      load();
    } catch { }
  }, [load]);

  const handleRegenToken = useCallback(async (id) => {
    try {
      await api.post(`/companies/${id}/token/regenerate`);
      load();
    } catch { }
  }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Empresas ({companies.length})</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl px-4 py-2 transition-all">
          <Plus className="h-4 w-4" /> Nueva empresa
        </button>
      </div>
      {companies.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">No hay empresas registradas. Crea la primera.</div>
      ) : (
        <div className="space-y-3">
          {companies.map(c => (
            <div key={c.id || c._id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <h3 className="font-bold text-lg truncate">{c.name}</h3>
                      <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-red-500/15 text-red-300 border border-red-500/30"}`}>{c.status || "active"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{c.plan_name || "Basic"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditing(c); setModalOpen(true); }} className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all" title="Editar"><Edit3 className="h-4 w-4 text-neutral-400" /></button>
                    <button onClick={() => handleDelete(c.id || c._id)} className="h-9 w-9 rounded-lg border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center transition-all" title="Eliminar"><Trash2 className="h-4 w-4 text-red-400" /></button>
                    <button onClick={() => toggleExpand(c.id || c._id)} className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all">
                      {expanded[c.id || c._id] ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                  <span>Token: <TokenDisplay token={c.site_token} onRegenerate={() => handleRegenToken(c.id || c._id)} /></span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                  <span>Monitoristas: <strong className="text-white">{c.monitor_count || 0}</strong></span>
                  <span>Max conductores: <strong className="text-white">{c.max_drivers || 3}</strong></span>
                  <span>Creada: <strong className="text-white">{new Date(c.created_at).toLocaleDateString()}</strong></span>
                </div>
              </div>
              {expanded[c.id || c._id] && (
                <div className="border-t border-white/10 px-5 py-4 bg-white/[0.02]">
                  <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">Monitoristas asignados</h4>
                  {monitors[c.id || c._id]?.length > 0 ? (
                    <div className="space-y-2">
                      {monitors[c.id || c._id].map(m => (
                        <div key={m.email} className="flex items-center gap-3 text-sm">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-300 font-bold">{m.name?.[0] || "?"}</div>
                          <div><div className="font-medium">{m.name}</div><div className="text-xs text-neutral-500">{m.email}</div></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500">Sin monitoristas asignados todavía.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {modalOpen && <CompanyModal company={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/plans");
        setPlans(data);
      } catch { }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Planes ({plans.length})</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.name} className={`rounded-2xl border p-5 ${p.popular ? "border-emerald-500/40 bg-emerald-500/[0.04]" : "border-white/10 bg-white/[0.03]"}`}>
            {p.popular && <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 mb-2">Más popular</div>}
            <div className="text-lg font-bold">{p.name}</div>
            <div className="text-3xl font-bold mt-2">${p.price}<span className="text-sm text-neutral-500 font-normal">/mes</span></div>
            <div className="text-sm text-neutral-400 mt-1">Hasta {p.max_drivers} conductores</div>
            <ul className="mt-4 space-y-2">
              {(p.features || []).map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-neutral-300"><Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch { }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Panel de control</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Conductores totales" value={stats?.total_drivers || 0} accent="emerald" />
        <StatsCard icon={Activity} label="Conductores activos" value={stats?.active_drivers || 0} accent="emerald" />
        <StatsCard icon={AlertCircle} label="Alertas críticas" value={stats?.critical_alerts || 0} accent="red" />
        <StatsCard icon={BarChart3} label="Impactos totales" value={stats?.total_impacts || 0} accent="emerald" />
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm text-neutral-400">
          <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4" /> Últimas 24h: <strong className="text-white">{stats?.impacts_last_24h || 0}</strong> impactos</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Modo: <strong className="text-white">{stats?.demo_mode ? "Demo" : "Producción"}</strong></div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard, Tab: OverviewTab },
  { id: "companies", label: "Empresas", icon: Building2, Tab: CompaniesTab },
  { id: "plans", label: "Planes", icon: CreditCard, Tab: PlansTab },
];

function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const ActiveComponent = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab);
    return tab?.Tab || OverviewTab;
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] p-5 flex flex-col flex-shrink-0 hidden lg:flex">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 leading-tight">SuperAdmin</div>
            <div className="text-base font-bold leading-tight">C.R.A.S.H.</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.id ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="text-xs text-neutral-500 px-3 truncate">{user?.email}</div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-400" />
            <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">SuperAdmin</div><div className="font-bold">C.R.A.S.H.</div></div>
          </div>
          <div className="flex items-center gap-2">
            <select value={activeTab} onChange={e => setActiveTab(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none">
              {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button onClick={handleLogout} className="h-9 w-9 rounded-lg border border-red-500/30 flex items-center justify-center"><LogOut className="h-4 w-4 text-red-400" /></button>
          </div>
        </div>
        <ActiveComponent />
      </main>
    </div>
  );
}

export default memo(AdminPanel);
