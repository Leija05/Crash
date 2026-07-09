import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, formatApiError } from "../lib/api";
import {
  LayoutDashboard, Building2, CreditCard, Users, Key, LogOut,
  Plus, Trash2, Edit3, Copy, RefreshCw, Loader2, Check, X,
  ChevronDown, ChevronRight, Shield, Activity, Mail, Phone,
  AlertCircle, Settings, BarChart3, Clock, Eye, Package, TrendingUp,
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
  const [planId, setPlanId] = useState(company?.plan_id || "");
  const [cycle, setCycle] = useState(company?.cycle || "Mensual");
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const isEdit = !!company;

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/plans"); setPlans(data || []); } catch { setPlans([]); }
    })();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) {
        await api.put(`/companies/${company.id}`, { name, email, phone });
      } else {
        const payload = { name, email, phone };
        if (planId) { payload.plan_id = planId; payload.cycle = cycle; }
        await api.post("/companies", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(formatApiError(err));
    }
    setBusy(false);
  }, [name, email, phone, planId, cycle, isEdit, company, onClose, onSaved]);

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
          {!isEdit && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Plan (genera tokens automáticamente)</label>
                <select value={planId} onChange={e => setPlanId(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all">
                  <option value="">Sin plan (sin tokens por ahora)</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mes · {p.max_drivers} cond. · {p.max_monitors} mon.</option>)}
                </select>
              </div>
              {planId && (
                <div>
                  <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Ciclo de facturación</label>
                  <select value={cycle} onChange={e => setCycle(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all">
                    {["Semanal", "Mensual", "Bimestral", "Trimestral", "Anual"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
          <button disabled={busy} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear empresa"}
          </button>
          {!isEdit && !planId && (
            <p className="text-[11px] text-neutral-500 text-center">Sin plan la empresa queda sin tokens. Podrás comprar un paquete después desde su sección de tokens.</p>
          )}
        </form>
      </div>
    </div>
  );
}

function TokenRow({ token, onRegenerate, onDeactivate }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [token.token]);

  const used = token.use_count || 0;
  const max = token.max_uses || 0;
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const active = token.active !== false;
  const isMonitor = token.role === "monitorista";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${isMonitor ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"}`}>
            {isMonitor ? "Monitorista" : "Empresa"}
          </span>
          {!active && <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-neutral-500/15 text-neutral-400 border border-neutral-500/30">Inactivo</span>}
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{token.cycle || "Mensual"}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={handleCopy} className="h-7 w-7 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all" title="Copiar">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
          </button>
          {onRegenerate && (
            <button onClick={() => { if (confirm("¿Regenerar? Los usuarios deberán usar el nuevo token.")) onRegenerate(); }} className="h-7 w-7 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all" title="Regenerar">
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
            </button>
          )}
          {onDeactivate && active && (
            <button onClick={() => { if (confirm("¿Desactivar este token?")) onDeactivate(); }} className="h-7 w-7 rounded-lg border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center transition-all" title="Desactivar">
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          )}
        </div>
      </div>
      <code className="block font-mono text-xs text-emerald-300 tracking-wider break-all mb-3">{token.token}</code>
      <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
        <span>Usos</span>
        <span className="text-white font-medium">{used} / {max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BuyPackageModal({ company, onClose, onSaved }) {
  const [planId, setPlanId] = useState(company?.plan_id || "");
  const [cycle, setCycle] = useState(company?.cycle || "Mensual");
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const cid = company?.id || company?._id;

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/plans"); setPlans(data || []); } catch { setPlans([]); }
    })();
  }, []);

  const handleBuy = useCallback(async () => {
    setBusy(true);
    try {
      await api.post(`/companies/${cid}/buy-package`, { plan_id: planId, cycle });
      onSaved();
      onClose();
    } catch (err) {
      alert(formatApiError(err));
    }
    setBusy(false);
  }, [planId, cycle, cid, onSaved, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"><Package className="h-5 w-5 text-emerald-400" /></div>
          <div><div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Comprar paquete</div><div className="font-bold">{company?.name}</div></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Plan</label>
            <select value={planId} onChange={e => setPlanId(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all">
              <option value="">Selecciona un plan</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mes · {p.max_drivers} cond. · {p.max_monitors} mon.</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Ciclo de facturación</label>
            <select value={cycle} onChange={e => setCycle(e.target.value)} className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all">
              {["Semanal", "Mensual", "Bimestral", "Trimestral", "Anual"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <p className="text-[11px] text-neutral-500">La compra es simulada: al confirmar se generan los tokens de empresa y monitorista según el plan.</p>
          <button disabled={busy || !planId} onClick={handleBuy} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            {busy ? "Generando tokens..." : "Comprar y generar tokens"}
          </button>
        </div>
      </div>
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

  const [tokens, setTokens] = useState({});
  const [buyOpen, setBuyOpen] = useState(null);
  const [drivers, setDrivers] = useState({});

  const loadMonitors = useCallback(async (companyId) => {
    try {
      const { data } = await api.get(`/companies/${companyId}/monitors`);
      setMonitors(prev => ({ ...prev, [companyId]: data }));
    } catch { }
  }, []);

  const loadTokens = useCallback(async (companyId) => {
    try {
      const { data } = await api.get(`/companies/${companyId}/tokens`);
      setTokens(prev => ({ ...prev, [companyId]: data }));
    } catch { }
  }, []);

  const loadDrivers = useCallback(async (companyId) => {
    try {
      const { data } = await api.get(`/companies/${companyId}/drivers`);
      setDrivers(prev => ({ ...prev, [companyId]: data }));
    } catch { }
  }, []);

  const toggleExpand = useCallback((id) => {
    const isNow = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: isNow }));
    if (isNow) {
      if (!monitors[id]) loadMonitors(id);
      if (!tokens[id]) loadTokens(id);
      if (!drivers[id]) loadDrivers(id);
    }
  }, [expanded, monitors, tokens, drivers, loadMonitors, loadTokens, loadDrivers]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm("¿Eliminar empresa y todos sus monitoristas?")) return;
    try {
      await api.delete(`/companies/${id}`);
      load();
    } catch { }
  }, [load]);

  const handleRegenToken = useCallback(async (id, planId, cycle) => {
    try {
      await api.post(`/tokens/regenerate`, { company_id: id, plan_id: planId, cycle: cycle || "Mensual" });
      loadTokens(id);
      load();
    } catch (err) { alert(formatApiError(err)); }
  }, [loadTokens, load]);

  const handleCreateMonitor = useCallback(async (id, cycle) => {
    try {
      await api.post(`/tokens/${id}/monitorista`, { cycle: cycle || "Mensual" });
      loadTokens(id);
    } catch (err) { alert(formatApiError(err)); }
  }, [loadTokens]);

  const handleDeactivate = useCallback(async (token) => {
    try {
      await api.post(`/tokens/deactivate`, { token: token.token });
      loadTokens(token.company_id);
    } catch (err) { alert(formatApiError(err)); }
  }, [loadTokens]);

  const handleBuy = useCallback(async () => {
    setBuyOpen(null);
    loadTokens(buyOpen?.id || buyOpen?._id);
    load();
  }, [buyOpen, loadTokens, load]);

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
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${c.has_token ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"}`}>
                    {c.has_token ? "Con tokens" : "Sin token"}
                  </span>
                  {!c.has_token && (
                    <button onClick={() => setBuyOpen(c)} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg px-3 py-1.5 transition-all">
                      <Package className="h-3.5 w-3.5" /> Comprar paquete
                    </button>
                  )}
                  {c.has_token && (
                    <button onClick={() => handleRegenToken(c.id || c._id, c.plan_id, c.cycle)} className="inline-flex items-center gap-1.5 border border-white/10 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-all" title="Regenerar ambos tokens">
                      <RefreshCw className="h-3.5 w-3.5 text-amber-400" /> Regenerar tokens
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                  <span>Monitoristas: <strong className="text-white">{c.monitor_count || 0}</strong></span>
                  <span>Max conductores: <strong className="text-white">{c.max_drivers || 3}</strong></span>
                  <span>Creada: <strong className="text-white">{new Date(c.created_at).toLocaleDateString()}</strong></span>
                </div>
              </div>
              {expanded[c.id || c._id] && (
                <div className="border-t border-white/10 px-5 py-4 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Tokens de acceso</h4>
                    {c.has_token && (
                      <button onClick={() => handleCreateMonitor(c.id || c._id, c.cycle)} className="inline-flex items-center gap-1.5 border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 rounded-lg px-2.5 py-1.5 text-xs transition-all" title="Crear/regenerar token de monitorista">
                        <Key className="h-3.5 w-3.5" /> Nuevo token monitorista
                      </button>
                    )}
                  </div>
                  {tokens[c.id || c._id]?.length > 0 ? (
                    <div className="space-y-3">
                      {tokens[c.id || c._id].map(t => (
                        <TokenRow
                          key={t.token}
                          token={t}
                          onRegenerate={t.role === "monitorista" ? () => handleCreateMonitor(c.id || c._id, c.cycle) : () => handleRegenToken(c.id || c._id, c.plan_id, c.cycle)}
                          onDeactivate={() => handleDeactivate(t)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500">Sin tokens. {c.has_token ? "Cárgalos de nuevo expandiendo." : "Compra un paquete para generarlos."}</div>
                  )}
                  <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mt-5 mb-3">Monitoristas asignados</h4>
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
                <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mt-5 mb-3">Conductores vinculados</h4>
                {drivers[c.id || c._id]?.length > 0 ? (
                  <div className="space-y-2">
                    {drivers[c.id || c._id].map(d => (
                      <div key={d.id || d.email} className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-300 font-bold">{d.name?.[0] || "?"}</div>
                        <div><div className="font-medium">{d.name}</div><div className="text-xs text-neutral-500">{d.email}{d.created_at ? ` · desde ${new Date(d.created_at).toLocaleDateString()}` : ""}</div></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">Ningún conductor ha vinculado su cuenta a esta empresa todavía.</div>
                )}
              )}
            </div>
          ))}
        </div>
      )}
       {modalOpen && <CompanyModal company={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
       {buyOpen && <BuyPackageModal company={buyOpen} onClose={() => setBuyOpen(null)} onSaved={handleBuy} />}
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
  { id: "logistics", label: "Logística de Ventas", icon: TrendingUp, Tab: SalesLogisticsTab },
];

function SalesLogisticsTab() {
  const [drivers, setDrivers] = useState(50);
  const [price, setPrice] = useState(150);
  const [fixed, setFixed] = useState(1300);
  const [margin, setMargin] = useState(35);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/sales/logistics", { params: { drivers, b2b_price_per_driver: price, fixed_monthly: fixed, target_margin: margin / 100 } })
      .then((r) => { if (!cancelled) { setData(r.data); setError(""); } })
      .catch((e) => { if (!cancelled) setError(formatApiError(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [drivers, price, fixed, margin]);

  const mxn = (n) => `$${Number(Math.round(n || 0)).toLocaleString("es-MX")} MXN`;
  const b2b = data?.b2b;
  const b2c = data?.b2c;
  const scenario = b2b?.scenario;

  const NumberField = ({ label, value, onChange, suffix, step = 1 }) => (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 block mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-white/[0.03] border border-white/10 focus:border-emerald-400/50 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-all font-mono"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs pointer-events-none">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold font-mono text-2xl tracking-tight">Logística de Ventas</h2>
        <p className="text-neutral-400 text-sm mt-1 max-w-3xl">
          Calcula cuántos conductores puedes ofrecer a empresas a un buen precio sin perder rentabilidad.
          Modelo basado en costos del proyecto: dispositivo ${mxn(800)} por unidad y ${mxn(1300)} de gastos fijos mensuales.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card-premium p-6 space-y-4" style={{ borderRadius: 20 }}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-mono">Simulador</div>
          <NumberField label="Conductores (repartidores)" value={drivers} onChange={setDrivers} />
          <NumberField label="Precio B2B por repartidor" value={price} onChange={setPrice} suffix="MXN/mes" />
          <NumberField label="Gastos fijos mensuales" value={fixed} onChange={setFixed} suffix="MXN" />
          <NumberField label="Margen objetivo" value={margin} onChange={setMargin} suffix="%" />
        </div>

        <div className="lg:col-span-2 space-y-5">
          {loading && <div className="card-premium p-10 flex items-center justify-center text-neutral-500"><Loader2 className="animate-spin" /></div>}
          {error && <div className="border border-red-500/30 bg-red-500/10 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
          {!loading && scenario && (
            <>
              <div className={`card-premium p-6 relative overflow-hidden ${scenario.meets_target_margin ? "" : "ring-1 ring-amber-500/30"}`} style={{ borderRadius: 20 }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="font-bold font-mono">Escenario para {drivers} conductores</span>
                  {scenario.meets_target_margin ? (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">Rentable</span>
                  ) : (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">Bajo margen</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">Ingreso/mes</div>
                    <div className="font-mono font-bold text-lg mt-1">{mxn(scenario.monthly_revenue)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">Utilidad/mes</div>
                    <div className="font-mono font-bold text-lg mt-1 text-emerald-400">{mxn(scenario.monthly_profit)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">Margen</div>
                    <div className="font-mono font-bold text-lg mt-1">{scenario.margin_pct}%</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">ROI hardware</div>
                    <div className="font-mono font-bold text-lg mt-1">{scenario.roi_months != null ? `${scenario.roi_months} meses` : "—"}</div>
                  </div>
                </div>
              </div>

              <div className="card-premium p-6" style={{ borderRadius: 20 }}>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-mono mb-3">Capacidad ofrecible a empresas</div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 p-4">
                    <div className="text-neutral-500 text-xs">Punto de equilibrio</div>
                    <div className="font-mono font-bold text-xl mt-1">{b2b.breakeven_drivers} <span className="text-sm text-neutral-500 font-normal">conductores</span></div>
                    <div className="text-[11px] text-neutral-500 mt-1">Para cubrir gastos fijos.</div>
                  </div>
                  <div className="rounded-xl border border-white/10 p-4">
                    <div className="text-neutral-500 text-xs">Margen objetivo ({margin}%)</div>
                    <div className="font-mono font-bold text-xl mt-1">{b2b.min_drivers_for_target_margin} <span className="text-sm text-neutral-500 font-normal">conductores</span></div>
                    <div className="text-[11px] text-neutral-500 mt-1">Mínimo para tu margen.</div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <div className="text-neutral-500 text-xs">Oferta recomendada</div>
                    <div className="font-mono font-bold text-xl mt-1 text-emerald-400">Desde {b2b.recommended_min_drivers}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">Conductores a buen precio.</div>
                  </div>
                </div>
              </div>

              <div className="card-premium p-6" style={{ borderRadius: 20 }}>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-mono mb-3">Escenarios de referencia</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-neutral-500 text-left border-b border-white/10">
                        <th className="py-2 pr-4 font-medium">Conductores</th>
                        <th className="py-2 pr-4 font-medium">Ingreso/mes</th>
                        <th className="py-2 pr-4 font-medium">Utilidad/mes</th>
                        <th className="py-2 pr-4 font-medium">Margen</th>
                        <th className="py-2 font-medium">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b2b.scenarios.map((s) => (
                        <tr key={s.drivers} className="border-b border-white/5">
                          <td className="py-2 pr-4 font-mono">{s.drivers}</td>
                          <td className="py-2 pr-4 font-mono">{mxn(s.monthly_revenue)}</td>
                          <td className="py-2 pr-4 font-mono text-emerald-400">{mxn(s.monthly_profit)}</td>
                          <td className="py-2 pr-4 font-mono">{s.margin_pct}%</td>
                          <td className="py-2 font-mono">{s.roi_months != null ? `${s.roi_months} m` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {b2c && (
                <div className="card-premium p-6" style={{ borderRadius: 20 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 font-mono">Lado B2C (usuario final)</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div><div className="text-neutral-500 text-xs">Suscripción/mes</div><div className="font-mono font-bold mt-1">{mxn(b2c.subscription)}</div></div>
                    <div><div className="text-neutral-500 text-xs">Dispositivo</div><div className="font-mono font-bold mt-1">{mxn(b2c.device_price)}</div></div>
                    <div><div className="text-neutral-500 text-xs">Margen dispositivo</div><div className="font-mono font-bold mt-1 text-emerald-400">{b2c.device_margin_pct}%</div></div>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-3">El precio B2C es menor porque no incluye instalación ni dashboard corporativo.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
