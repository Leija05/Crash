import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMapEvents } from "react-leaflet";
import { useAuth } from "../auth/AuthContext";
import { api, formatApiError, superAdminAPI, adminAPI, companyAPI, analyticsAPI, geofencesAPI, versionsAPI } from "../lib/api";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PremiumModal from "../components/ui/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import PromptDialog from "../components/PromptDialog";
import { useCloseOnBrowserBack, closeModalViaHistory } from "../hooks/useCloseOnBrowserBack";
import { useI18n } from "../i18n";
import {
  LayoutDashboard, Building2, CreditCard, Users, Key, LogOut,
  Plus, Trash2, Edit3, Copy, RefreshCw, Loader2, Check, X,
  ChevronDown, ChevronRight, Shield, Activity, Mail, Phone,
  AlertCircle, BarChart3, Clock, Eye, Package, TrendingUp,
  UserPlus, ScrollText, LifeBuoy, Map as MapIcon, Bell, Webhook,
  CalendarClock, Send, CheckCircle2, CalendarPlus, Slack,
  PanelLeftClose, PanelLeftOpen, LineChart as LineChartIcon, Globe,
  ShieldAlert, MapPin, Timer, Download, Smartphone,
} from "lucide-react";

const err = (e) => toast.error(formatApiError(e));
const ok = (m) => toast.success(m);

const CYCLE_OPTIONS = [
  { v: "Semanal", k: "cycleWeekly" },
  { v: "Mensual", k: "cycleMonthly" },
  { v: "Bimestral", k: "cycleBimonthly" },
  { v: "Trimestral", k: "cycleQuarterly" },
  { v: "Anual", k: "cycleYearly" },
];

const ACCENTS = {
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  red: "bg-red-500/10 border-red-500/30 text-red-400",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  default: "bg-white/5 border-white/10 text-neutral-400",
};

const ACCENT_GLOW = {
  emerald: "group-hover:shadow-[0_18px_50px_-12px_rgba(16,185,129,0.25)]",
  red: "group-hover:shadow-[0_18px_50px_-12px_rgba(239,68,68,0.25)]",
  amber: "group-hover:shadow-[0_18px_50px_-12px_rgba(245,158,11,0.25)]",
  blue: "group-hover:shadow-[0_18px_50px_-12px_rgba(59,130,246,0.25)]",
  default: "",
};
const ACCENT_BAR = {
  emerald: "from-emerald-500/60", red: "from-red-500/60",
  amber: "from-amber-500/60", blue: "from-blue-500/60", default: "from-white/20",
};

function StatsCard({ icon: Icon, label, value, accent }) {
  const cardRef = useCallback((node) => {
    if (!node) return;
    const handleMouse = (e) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      node.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };
    node.addEventListener('mousemove', handleMouse);
    return () => node.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div ref={cardRef} className={`admin-stat-card group ${ACCENT_GLOW[accent] || ""}`}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/[0.02] blur-2xl group-hover:bg-white/[0.04] transition-all duration-500" />
      <div className={`absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b to-transparent ${ACCENT_BAR[accent] || ACCENT_BAR.default} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${ACCENTS[accent] || ACCENTS.default}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative text-3xl font-bold tracking-tight tabular-nums font-mono">{value}</div>
      <div className="relative text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-1.5 font-medium">{label}</div>
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
  useCloseOnBrowserBack(true, onClose);
  const close = useCallback(() => closeModalViaHistory(onClose), [onClose]);
  const { t } = useI18n();

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
      close();
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setBusy(false);
  }, [name, email, phone, planId, cycle, isEdit, company, close, onSaved]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 admin-modal-backdrop" onClick={close}>
      <div className="admin-modal-content w-full max-w-md p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/8 transition-all duration-200 active:scale-95"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-400" /></div>
          <div><div className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-medium">{isEdit ? t("admin.edit", "Editar") : t("admin.new", "Nueva")} empresa</div><div className="font-bold">{isEdit ? t("admin.edit", "Editar") + " " + company.name : t("admin.registerCompany", "Registrar empresa")}</div></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">{t("admin.name", "Nombre")}</label>
            <input value={name} onChange={e => setName(e.target.value)} className="admin-input" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">{t("admin.email", "Email")}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="admin-input" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">{t("admin.phone", "Teléfono")}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="admin-input" />
          </div>
          {!isEdit && (
            <>
              <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">{t("admin.planGeneratesTokens", "Plan (genera tokens automáticamente)")}</label>
            <select value={planId} onChange={e => setPlanId(e.target.value)} className="admin-input">
              <option value="">{t("admin.noPlanYet", "Sin plan (sin tokens por ahora)")}</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}{t("admin.perMonth", "/mes")} · {p.max_drivers} {t("admin.driversAbbr", "cond.")} · {p.max_monitors} {t("admin.monitorsAbbr", "mon.")}</option>)}
            </select>
              </div>
              {planId && (
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">Ciclo de facturación</label>
                  <select value={cycle} onChange={e => setCycle(e.target.value)} className="admin-input">
                    {["Semanal", "Mensual", "Bimestral", "Trimestral", "Anual"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
          <button disabled={busy} className="admin-btn-primary w-full flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? t("admin.saving", "Guardando...") : isEdit ? t("admin.saveChanges", "Guardar cambios") : t("admin.createCompany", "Crear empresa")}
          </button>
          {!isEdit && !planId && (
            <p className="text-[11px] text-neutral-500 text-center">{t("admin.noPlanNotice", "Sin plan la empresa queda sin tokens. Podrás comprar un paquete después desde su sección de tokens.")}</p>
          )}
        </form>
      </div>
    </div>
  );
}

function TokenRow({ token, onRegenerate, onDeactivate }) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(null); // { kind: 'regenerate' | 'deactivate' }
  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [token.token]);
  const { t } = useI18n();

  const used = token.use_count || 0;
  const max = token.max_uses || 0;
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const active = token.active !== false;
  const isMonitor = token.role === "monitorista";

  return (
    <div className="admin-content-card p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className={`admin-badge ${isMonitor ? "admin-badge-amber" : "admin-badge-emerald"}`}>
            {isMonitor ? t("admin.monitorist", "Monitorista") : t("admin.company", "Empresa")}
          </span>
          {!active && <span className="admin-badge admin-badge-neutral">{t("admin.inactive", "Inactivo")}</span>}
          <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 font-medium">{token.cycle || "Mensual"}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={handleCopy} className="admin-btn-ghost !px-2 !py-1.5" title={t("admin.copy", "Copiar")}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
          </button>
          {onRegenerate && (
            <button onClick={() => setPending({ kind: "regenerate" })} className="admin-btn-ghost !px-2 !py-1.5" title={t("admin.regenerate", "Regenerar")}>
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
            </button>
          )}
          {onDeactivate && active && (
            <button onClick={() => setPending({ kind: "deactivate" })} className="admin-btn-ghost !px-2 !py-1.5 !border-red-500/20 hover:!bg-red-500/8" title={t("admin.deactivate", "Desactivar")}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          )}
        </div>
      </div>
      <code className="block font-mono text-xs text-emerald-300 tracking-wider break-all mb-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">{token.token}</code>
      <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
        <span>{t("admin.uses", "Usos")}</span>
        <span className="text-white font-semibold font-mono">{used} / {max}</span>
      </div>
      <div className="admin-progress">
        <div className={`admin-progress-fill ${pct >= 100 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => {
          const kind = pending?.kind;
          setPending(null);
          if (kind === "regenerate") onRegenerate?.();
          else if (kind === "deactivate") onDeactivate?.();
        }}
        title={pending?.kind === "deactivate" ? t("admin.deactivateToken", "Desactivar token") : t("admin.regenerateToken", "Regenerar token")}
        message={pending?.kind === "deactivate"
          ? t("admin.deactivateTokenMsg", "Se desactivará este token y dejará de funcionar para acceder al monitoreo.")
          : t("admin.regenerateTokenMsg", "Los usuarios deberán usar el nuevo token generado.")}
        confirmLabel={pending?.kind === "deactivate" ? t("admin.deactivate", "Desactivar") : t("admin.regenerate", "Regenerar")}
        danger={pending?.kind === "deactivate"}
        testId={pending?.kind === "deactivate" ? "confirm-deactivate-token" : "confirm-regen-token"}
      />
    </div>
  );
}

function BuyPackageModal({ company, onClose, onSaved }) {
  const [planId, setPlanId] = useState(company?.plan_id || "");
  const [cycle, setCycle] = useState(company?.cycle || "Mensual");
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const cid = company?.id || company?._id;
  useCloseOnBrowserBack(true, onClose);
  const close = useCallback(() => closeModalViaHistory(onClose), [onClose]);
  const { t } = useI18n();

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
      close();
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setBusy(false);
  }, [planId, cycle, cid, close, onSaved]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 admin-modal-backdrop" onClick={close}>
      <div className="admin-modal-content w-full max-w-md p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/8 transition-all duration-200 active:scale-95"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"><Package className="h-5 w-5 text-emerald-400" /></div>
          <div><div className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-medium">{t("admin.buyPackage", "Comprar paquete")}</div><div className="font-bold">{company?.name}</div></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">{t("admin.plan", "Plan")}</label>
            <select value={planId} onChange={e => setPlanId(e.target.value)} className="admin-input">
              <option value="">{t("admin.selectPlan", "Selecciona un plan")}</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}{t("admin.perMonth", "/mes")} · {p.max_drivers} {t("admin.driversAbbr", "cond.")} · {p.max_monitors} {t("admin.monitorsAbbr", "mon.")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5 block font-medium">{t("admin.billingCycle", "Ciclo de facturación")}</label>
            <select value={cycle} onChange={e => setCycle(e.target.value)} className="admin-input">
              {CYCLE_OPTIONS.map(o => <option key={o.v} value={o.v}>{t("admin." + o.k, o.v)}</option>)}
            </select>
          </div>
          <p className="text-[11px] text-neutral-500">{t("admin.purchaseSimulated", "La compra es simulada: al confirmar se generan los tokens de empresa y monitorista según el plan.")}</p>
          <button disabled={busy || !planId} onClick={handleBuy} className="admin-btn-primary w-full flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            {busy ? t("admin.generatingTokens", "Generando tokens...") : t("admin.buyAndGenerateTokens", "Comprar y generar tokens")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscriptionPanel({ company, onChanged }) {
  const cid = company?.id || company?._id;
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  const exp = company?.subscription_expires_at;
  const expDate = exp ? new Date(exp) : null;
  const daysLeft = expDate ? Math.ceil((expDate - new Date()) / 86400000) : null;
  const expired = daysLeft != null && daysLeft < 0;
  const warn = daysLeft != null && daysLeft >= 0 && daysLeft <= 7;

  const extend = useCallback(async (days) => {
    setBusy(true);
    try {
      await companyAPI.extendSubscription(cid, days);
      ok(`${t("admin.subscriptionExtended", "Suscripción extendida")} ${days} ${t("admin.days", "días")}`);
      onChanged?.();
    } catch (e) { err(e); }
    setBusy(false);
  }, [cid, onChanged, t]);

  return (
    <div className="mt-5">
      <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3 font-semibold">{t("admin.subscription", "Suscripción")}</h4>
      <div className="admin-content-card p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock className={`h-4 w-4 ${expired ? "text-red-400" : warn ? "text-amber-400" : "text-emerald-400"}`} />
          {expDate ? (
            <span>
              Vence: <strong className="text-white font-semibold">{expDate.toLocaleDateString()}</strong>
              <span className={`ml-2 text-xs ${expired ? "text-red-400" : warn ? "text-amber-400" : "text-neutral-500"}`}>
                {expired ? `· ${t("admin.subscriptionExpired", "Expirada")}` : `· ${daysLeft} ${t("admin.dayS", "día(s)")}`}
              </span>
            </span>
          ) : <span className="text-neutral-500">{t("admin.noExpiration", "Sin fecha de expiración")}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[30, 90, 365].map((d) => (
            <button key={d} disabled={busy} onClick={() => extend(d)} className="admin-btn-ghost inline-flex items-center gap-1.5 !border-emerald-500/25 hover:!bg-emerald-500/8 !text-emerald-300 disabled:opacity-50">
              <CalendarPlus className="h-3.5 w-3.5" /> +{d === 365 ? `1 ${t("admin.year", "año")}` : `${d}${t("admin.daysAbbr", "d")}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const WEBHOOK_EVENTS = [
  { id: "impact", label: "Impactos" },
  { id: "token_low", label: "Tokens por agotarse" },
  { id: "subscription_expiring", label: "Suscripción por vencer" },
];

function WebhooksPanel({ company }) {
  const cid = company?.id || company?._id;
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try { const { data } = await companyAPI.getWebhooks(cid); setCfg(data); }
      catch { setCfg({ slack_webhook_url: "", whatsapp_number: "", enabled: false, events: ["impact"] }); }
    })();
  }, [cid]);

  const toggleEvent = (id) => setCfg((p) => ({
    ...p,
    events: p.events.includes(id) ? p.events.filter((e) => e !== id) : [...p.events, id],
  }));

  const save = useCallback(async () => {
    setBusy(true);
    try { await companyAPI.setWebhooks(cid, cfg);       ok(t("admin.webhooksSaved", "Webhooks guardados")); }
    catch (e) { err(e); }
    setBusy(false);
  }, [cid, cfg, t]);

  const test = useCallback(async () => {
    try { const { data } = await companyAPI.testWebhook(cid); ok(`${t("admin.testSent", "Prueba enviada")} · Slack: ${data.slack ? t("admin.ok", "ok") : "—"} · WhatsApp: ${data.whatsapp ? t("admin.ok", "ok") : "—"}`); }
    catch (e) { err(e); }
  }, [cid, t]);

  if (!cfg) return null;
  const inputCls = "w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all";

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500">{t("admin.alertWebhooks", "Webhooks de alerta")}</h4>
        <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} className="accent-emerald-500" />
          {t("admin.enabled", "Habilitado")}
        </label>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 flex items-center gap-1.5"><Slack className="h-3 w-3" /> {t("admin.slackWebhookUrl", "Slack Incoming Webhook URL")}</label>
          <input value={cfg.slack_webhook_url} onChange={(e) => setCfg({ ...cfg, slack_webhook_url: e.target.value })} placeholder="https://hooks.slack.com/services/..." className={inputCls} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 flex items-center gap-1.5"><Phone className="h-3 w-3" /> {t("admin.whatsappNumber", "WhatsApp (número con código país)")}</label>
          <input value={cfg.whatsapp_number} onChange={(e) => setCfg({ ...cfg, whatsapp_number: e.target.value })} placeholder="5215512345678" className={inputCls} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 block">{t("admin.events", "Eventos")}</label>
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((ev) => (
              <button key={ev.id} onClick={() => toggleEvent(ev.id)} className={`text-xs rounded-lg px-2.5 py-1.5 border transition-all ${cfg.events.includes(ev.id) ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-neutral-400 hover:bg-white/5"}`}>
                {t("admin.wh_" + ev.id, ev.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button disabled={busy} onClick={save} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg px-3 py-2 text-xs transition-all disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Webhook className="h-3.5 w-3.5" />} {t("admin.save", "Guardar")}
          </button>
          <button onClick={test} className="inline-flex items-center gap-1.5 border border-white/10 hover:bg-white/10 rounded-lg px-3 py-2 text-xs transition-all">
            <Send className="h-3.5 w-3.5" /> {t("admin.test", "Probar")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportSchedulePanel({ company }) {
  const cid = company?.id || company?._id;
  const init = company?.report_schedule || { frequency: "off", channel: "email", recipient: "" };
  const [cfg, setCfg] = useState(init);
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  const save = useCallback(async () => {
    setBusy(true);
    try {       await companyAPI.setReportSchedule(cid, cfg); ok(t("admin.scheduleSaved", "Programación guardada")); }
    catch (e) { err(e); }
    setBusy(false);
  }, [cid, cfg, t]);

  const selCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none";
  return (
    <div className="mt-5">
      <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">{t("admin.scheduledReports", "Reportes programados")}</h4>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 grid sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">{t("admin.frequency", "Frecuencia")}</label>
          <select value={cfg.frequency} onChange={(e) => setCfg({ ...cfg, frequency: e.target.value })} className={`${selCls} w-full`}>
            <option value="off">{t("admin.disabled", "Desactivado")}</option>
            <option value="daily">{t("admin.daily", "Diario")}</option>
            <option value="weekly">{t("admin.weekly", "Semanal")}</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">{t("admin.channel", "Canal")}</label>
          <select value={cfg.channel} onChange={(e) => setCfg({ ...cfg, channel: e.target.value })} className={`${selCls} w-full`}>
            <option value="email">{t("admin.email", "Email")}</option>
            <option value="whatsapp">{t("admin.whatsapp", "WhatsApp")}</option>
            <option value="slack">{t("admin.slack", "Slack")}</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">{t("admin.destination", "Destino")}</label>
          <input value={cfg.recipient} onChange={(e) => setCfg({ ...cfg, recipient: e.target.value })} placeholder={t("admin.emailOrNumber", "correo o número")} className={`${selCls} w-full`} />
        </div>
        <button disabled={busy} onClick={save} className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg px-3 py-2.5 text-xs transition-all disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />} {t("admin.save", "Guardar")}
        </button>
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
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/companies");
      setCompanies(data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); const _i = setInterval(load, 10000); return () => clearInterval(_i); }, [load]);

  const [tokens, setTokens] = useState({});
  const [buyOpen, setBuyOpen] = useState(null);
  const [drivers, setDrivers] = useState({});
  const { t } = useI18n();

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

  useEffect(() => {
    const ids = Object.keys(expanded).filter((id) => expanded[id]);
    if (ids.length === 0) return;
    const id = setInterval(() => {
      ids.forEach((cid) => { loadDrivers(cid); loadMonitors(cid); });
    }, 8000);
    return () => clearInterval(id);
  }, [expanded, loadDrivers, loadMonitors]);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const name = pendingDelete.name || t("admin.theCompany", "la empresa");
      await api.delete(`/companies/${pendingDelete.id}`);
      ok(`${t("admin.company", "Empresa")} "${name}" ${t("admin.andTokensDeleted", "y sus tokens eliminados correctamente.")}`);
      setPendingDelete(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); setDeleting(false); }
  }, [pendingDelete, load, t]);

  const handleRegenToken = useCallback(async (id, planId, cycle) => {
    try {
      await api.post(`/tokens/regenerate`, { company_id: id, plan_id: planId, cycle: cycle || "Mensual" });
      loadTokens(id);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  }, [loadTokens, load]);

  const handleCreateMonitor = useCallback(async (id, cycle) => {
    try {
      await api.post(`/tokens/${id}/monitorista`, { cycle: cycle || "Mensual" });
      loadTokens(id);
    } catch (err) { toast.error(formatApiError(err)); }
  }, [loadTokens]);

  const handleDeactivate = useCallback(async (token) => {
    try {
      await api.post(`/tokens/deactivate`, { token: token.token });
      loadTokens(token.company_id);
    } catch (err) { toast.error(formatApiError(err)); }
  }, [loadTokens]);

  const handleBuy = useCallback(async () => {
    setBuyOpen(null);
    loadTokens(buyOpen?.id || buyOpen?._id);
    load();
  }, [buyOpen, loadTokens, load]);

  const handleApprove = useCallback(async (id) => {
    try {
      await api.post(`/companies/${id}/approve`, {});
      toast.success(t("admin.companyApproved", "Empresa aprobada y aprovisionada"));
      loadTokens(id);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  }, [loadTokens, load, t]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t("admin.companiesTitle", "Empresas")} ({companies.length})</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl px-4 py-2 transition-all">
          <Plus className="h-4 w-4" /> {t("admin.newCompany", "Nueva empresa")}
        </button>
      </div>
      {companies.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">{t("admin.noCompanies", "No hay empresas registradas. Crea la primera.")}</div>
      ) : (
        <div className="space-y-3">
          {companies.map(c => (
            <div key={c.id || c._id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Building2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <h3 className="font-bold text-lg truncate">{c.name}</h3>
                      <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : c.status === "pending" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-red-500/15 text-red-300 border border-red-500/30"}`}>{c.status || "active"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{c.plan_name || "Basic"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditing(c); setModalOpen(true); }} className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all" title={t("admin.edit", "Editar")}><Edit3 className="h-4 w-4 text-neutral-400" /></button>
                    <button onClick={() => setPendingDelete({ id: c.id || c._id, name: c.name })} className="h-9 w-9 rounded-lg border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center transition-all" title={t("admin.delete", "Eliminar")}><Trash2 className="h-4 w-4 text-red-400" /></button>
                    <button onClick={() => toggleExpand(c.id || c._id)} className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all">
                      {expanded[c.id || c._id] ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${c.has_token ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"}`}>
                    {c.has_token ? t("admin.withTokens", "Con tokens") : t("admin.withoutToken", "Sin token")}
                  </span>
                  {c.status === "pending" && (
                    <button onClick={() => handleApprove(c.id || c._id)} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg px-3 py-1.5 transition-all">
                      <Package className="h-3.5 w-3.5" /> {t("admin.approveRegistration", "Aprobar registro")}
                    </button>
                  )}
                  {!c.has_token && (
                    <button onClick={() => setBuyOpen(c)} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg px-3 py-1.5 transition-all">
                      <Package className="h-3.5 w-3.5" /> {t("admin.buyPackage", "Comprar paquete")}
                    </button>
                  )}
                  {c.has_token && (
                    <button onClick={() => handleRegenToken(c.id || c._id, c.plan_id, c.cycle)} className="inline-flex items-center gap-1.5 border border-white/10 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-all" title={t("admin.regenBothTokens", "Regenerar ambos tokens")}>
                      <RefreshCw className="h-3.5 w-3.5 text-amber-400" /> {t("admin.regenTokens", "Regenerar tokens")}
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                  <span>{t("admin.monitorists", "Monitoristas")}: <strong className="text-white">{c.monitor_count || 0}</strong></span>
                  <span>{t("admin.maxDrivers", "Max conductores")}: <strong className="text-white">{c.max_drivers || 3}</strong></span>
                  <span>{t("admin.created", "Creada")}: <strong className="text-white">{new Date(c.created_at).toLocaleDateString()}</strong></span>
                </div>
              </div>
              {expanded[c.id || c._id] && (
                <div className="border-t border-white/10 px-4 sm:px-5 py-4 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500">{t("admin.accessTokens", "Tokens de acceso")}</h4>
                    {c.has_token && (
                      <button onClick={() => handleCreateMonitor(c.id || c._id, c.cycle)} className="inline-flex items-center gap-1.5 border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 rounded-lg px-2.5 py-1.5 text-xs transition-all" title={t("admin.createRegenMonitorToken", "Crear/regenerar token de monitorista")}>
                        <Key className="h-3.5 w-3.5" /> {t("admin.newMonitorToken", "Nuevo token monitorista")}
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
                    <div className="text-xs text-neutral-500">{t("admin.noTokens", "Sin tokens.")} {c.has_token ? t("admin.reloadExpanding", "Cárgalos de nuevo expandiendo.") : t("admin.buyPackageToGenerate", "Compra un paquete para generarlos.")}</div>
                  )}
                  <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mt-5 mb-3">{t("admin.assignedMonitorists", "Monitoristas asignados")}</h4>
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
                    <div className="text-xs text-neutral-500">{t("admin.noMonitoristsYet", "Sin monitoristas asignados todavía.")}</div>
                  )}
                <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mt-5 mb-3">{t("admin.linkedDrivers", "Conductores vinculados")}</h4>
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
                    <div className="text-xs text-neutral-500">{t("admin.noLinkedDrivers", "Ningún conductor ha vinculado su cuenta a esta empresa todavía.")}</div>
                  )}
                <SubscriptionPanel company={c} onChanged={load} />
                <WebhooksPanel company={c} />
                <ReportSchedulePanel company={c} />
              </div>
              )}
            </div>
          ))}
        </div>
      )}
        {modalOpen && <CompanyModal company={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
        {buyOpen && <BuyPackageModal company={buyOpen} onClose={() => setBuyOpen(null)} onSaved={handleBuy} />}
        <ConfirmDialog
          open={!!pendingDelete}
          onClose={() => !deleting && setPendingDelete(null)}
          onConfirm={handleDelete}
          title={t("admin.deleteCompany", "Eliminar empresa")}
          message={pendingDelete ? `${t("admin.confirmDeleteCompanyMsg", "¿Eliminar")} ${pendingDelete.name || t("admin.thisCompany", "esta empresa")} ${t("admin.andAllMonitorists", "y todos sus monitoristas? Esta acción no se puede deshacer.")}` : ""}
          confirmLabel={t("admin.delete", "Eliminar")}
          danger
          busy={deleting}
          testId="confirm-delete-company"
        />
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

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
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">{t("admin.plansTitle", "Planes")} ({plans.length})</h2>
        <p className="text-sm text-neutral-500 mt-1">Gestiona los planes de suscripción disponibles</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.name} className={`admin-content-card p-4 sm:p-5 ${p.popular ? "!border-emerald-500/30 !bg-emerald-500/[0.03]" : ""}`}>
            {p.popular && <div className="admin-badge admin-badge-emerald mb-2">{t("admin.mostPopular", "Más popular")}</div>}
            <div className="text-lg font-bold">{p.name}</div>
            <div className="text-3xl font-bold mt-2 font-mono tabular-nums">${p.price}<span className="text-sm text-neutral-500 font-normal">{t("admin.perMonth", "/mes")}</span></div>
            <div className="text-sm text-neutral-400 mt-1">{t("admin.upTo", "Hasta")} {p.max_drivers} {t("admin.drivers", "conductores")}</div>
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

function TokenAlertsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const run = async () => {
      try { const { data } = await adminAPI.tokenAlerts(); setData(data); } catch { }
      setLoading(false);
    };
    run();
    const _i = setInterval(run, 10000);
    return () => clearInterval(_i);
  }, []);

  if (loading) return null;
  const exhaustion = data?.exhaustion || [];
  const expiring = data?.expiring || [];
  const subscriptions = data?.subscriptions || [];
  const total = exhaustion.length + expiring.length + subscriptions.length;

  return (
    <div className="mt-6 admin-content-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center"><Bell className="h-4 w-4 text-amber-400" /></div>
        <div>
          <h3 className="font-bold">{t("admin.tokenSubAlerts", "Alertas de tokens y suscripciones")}</h3>
          <div className="text-xs text-neutral-500">{total === 0 ? t("admin.allGood", "Todo en orden") : `${total} ${t("admin.alertN", "alerta")}${total > 1 ? "s" : ""} ${t("admin.activeN", "activa")}${total > 1 ? "s" : ""}`}</div>
        </div>
      </div>
      {total === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> {t("admin.noTokensExpiring", "No hay tokens por agotarse ni suscripciones por vencer.")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2 font-semibold">{t("admin.tokensRunningOut", "Tokens por agotarse")}</h4>
              {exhaustion.length === 0 ? <div className="text-xs text-neutral-500">{t("admin.noAlerts", "Sin alertas.")}</div> : (
                <div className="space-y-2">
                  {exhaustion.map((a, i) => (
                    <div key={i} className="admin-content-card !bg-amber-500/[0.03] !border-amber-500/15 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{a.company_name}</span>
                        <span className="admin-badge admin-badge-amber">{a.role}</span>
                      </div>
                       <div className="text-xs text-neutral-400 mt-1 font-mono">{a.use_count}/{a.max_uses} {t("admin.uses", "usos")} · {t("admin.remain", "quedan")} {a.remaining}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2 font-semibold">{t("admin.tokensExpiring", "Tokens que expiran")}</h4>
              {expiring.length === 0 ? <div className="text-xs text-neutral-500">{t("admin.noAlerts", "Sin alertas.")}</div> : (
                <div className="space-y-2">
                  {expiring.map((a, i) => (
                    <div key={i} className={`admin-content-card p-3 ${a.expired ? "!bg-red-500/[0.04] !border-red-500/20" : "!bg-amber-500/[0.03] !border-amber-500/15"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{a.company_name}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${a.expired ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{a.role}</span>
                      </div>
                       <div className="text-xs text-neutral-400 mt-1">{a.expired ? t("admin.expired", "Expirado") : `${t("admin.expiresIn", "Vence en")} ${a.days_left} ${t("admin.dayS", "día(s)")}`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">{t("admin.subscriptionsExpiring", "Suscripciones por vencer")}</h4>
              {subscriptions.length === 0 ? <div className="text-xs text-neutral-500">{t("admin.noAlerts", "Sin alertas.")}</div> : (
              <div className="space-y-2">
                {subscriptions.map((a, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${a.expired ? "border-red-500/25 bg-red-500/[0.05]" : a.days_left <= 7 ? "border-orange-500/25 bg-orange-500/[0.05]" : "border-amber-500/20 bg-amber-500/[0.04]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{a.company_name}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${a.expired ? "bg-red-500/15 text-red-300" : a.days_left <= 7 ? "bg-orange-500/15 text-orange-300" : "bg-amber-500/15 text-amber-300"}`}>{a.expired ? t("admin.subscriptionExpired", "Expirada") : `${a.days_left} ${t("admin.dayS", "día(s)")}`}</span>
                    </div>
                      <div className="text-xs text-neutral-400 mt-1">{a.expired ? t("admin.subscriptionDue", "Suscripción vencida") : `${t("admin.remainDays", "Quedan")} ${a.days_left} ${t("admin.dayS", "día(s)")} ${t("admin.ofSubscription", "de suscripción")}`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch { }
      setLoading(false);
    };
    run();
    const _i = setInterval(run, 10000);
    return () => clearInterval(_i);
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">{t("admin.controlPanel", "Panel de control")}</h2>
        <p className="text-sm text-neutral-500 mt-1">Resumen general del sistema en tiempo real</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard icon={Users} label={t("admin.totalDrivers", "Conductores totales")} value={stats?.total_drivers || 0} accent="emerald" />
        <StatsCard icon={Activity} label={t("admin.activeDrivers", "Conductores activos")} value={stats?.active_drivers || 0} accent="emerald" />
        <StatsCard icon={AlertCircle} label={t("admin.criticalAlerts", "Alertas críticas")} value={stats?.critical_alerts || 0} accent="red" />
        <StatsCard icon={BarChart3} label={t("admin.totalImpacts", "Impactos totales")} value={stats?.total_impacts || 0} accent="emerald" />
      </div>
      <div className="mt-6 admin-content-card p-4 sm:p-5">
        <div className="text-sm text-neutral-400 space-y-2">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-neutral-500" /> {t("admin.last24h", "Últimas 24h")}: <strong className="text-white font-semibold">{stats?.impacts_last_24h || 0}</strong> {t("admin.impactsN", "impactos")}</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-neutral-500" /> {t("admin.mode", "Modo")}: <strong className="text-white font-semibold">{stats?.demo_mode ? t("admin.demo", "Demo") : t("admin.production", "Producción")}</strong></div>
        </div>
      </div>
      <TokenAlertsPanel />
    </div>
  );
}

const SEVERITY_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

function HeatmapTab() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/companies"); setCompanies(data || []); } catch { }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = { days };
    if (companyId) params.company_id = companyId;
    const run = (initial) => {
      if (initial) setLoading(true);
      adminAPI.heatmap(params)
        .then((r) => { if (!cancelled) setData(r.data); })
        .catch((e) => { if (!cancelled && initial) err(e); })
        .finally(() => { if (!cancelled && initial) setLoading(false); });
    };
    run(true);
    const _i = setInterval(() => run(false), 10000);
    return () => { cancelled = true; clearInterval(_i); };
  }, [companyId, days]);

  const points = data?.points || [];
  const zones = data?.zones || [];
  const center = points[0] ? [points[0].lat, points[0].lng] : [19.4326, -99.1332];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("admin.impactHeatmap", "Mapa de calor de impactos")}</h2>
          <p className="text-sm text-neutral-500 mt-1">Distribución geográfica de impactos detectados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="admin-input py-2 text-sm min-w-[140px]">
            <option value="">{t("admin.allCompanies", "Todas las empresas")}</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="admin-input py-2 text-sm min-w-[100px]">
            <option value={7}>{t("admin.d7", "7 días")}</option>
            <option value={30}>{t("admin.d30", "30 días")}</option>
            <option value={90}>{t("admin.d90", "90 días")}</option>
            <option value={365}>{t("admin.d365", "1 año")}</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-content-card overflow-hidden h-[300px] sm:h-[400px] lg:h-[520px] relative">
          {loading && <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/40"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>}
          <MapContainer key={`heat-${companyId}-${days}`} center={center} zoom={11} scrollWheelZoom className="h-full w-full" style={{ background: "#0a0a0a" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; carto.com' />
            {points.map((p, i) => (
              <CircleMarker key={i} center={[p.lat, p.lng]} radius={Math.min(20, 6 + (p.weight || 1) * 3)}
                pathOptions={{ color: SEVERITY_COLORS[p.severity] || "#10b981", fillColor: SEVERITY_COLORS[p.severity] || "#10b981", fillOpacity: 0.4, weight: 1, opacity: 0.6 }}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold capitalize">{p.severity}</div>
                    {p.company_name && <div>{p.company_name}</div>}
                    <div>{p.g_force != null ? `${Number(p.g_force).toFixed(2)}G` : ""}</div>
                    <div className="text-neutral-400">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="space-y-4">
          <div className="admin-content-card p-4 sm:p-5">
            <div className="text-3xl font-bold font-mono tabular-nums">{data?.total_points || 0}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-1.5 font-medium">{t("admin.geoImpacts", "impactos geolocalizados")} ({days}d)</div>
          </div>
          <div className="admin-content-card p-4 sm:p-5">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3 font-semibold">{t("admin.highestRiskZones", "Zonas de mayor riesgo")}</h4>
            {zones.length === 0 ? <div className="text-xs text-neutral-500">{t("admin.noDataPeriod", "Sin datos en el periodo.")}</div> : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {zones.slice(0, 12).map((z, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-white/4 last:border-0">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLORS[z.max_severity] }} />
                      <span className="font-mono text-xs text-neutral-400">{z.lat}, {z.lng}</span>
                    </span>
                     <span className="text-xs flex-shrink-0"><strong className="text-white">{z.count}</strong> · {t("admin.risk", "riesgo")} {z.risk}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SUPPORT_TYPE_LABELS = {
  password_reset: "Reinicio de contraseña",
  remove_token: "Quitar token",
  billing: "Facturación",
  otro: "Otro",
};

function TempPasswordModal({ result, onClose }) {
  const { t } = useI18n();
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(result.temp_password);
    ok(t("admin.passwordCopied", "Contraseña copiada"));
  }, [result, t]);
  return (
    <PremiumModal
      open
      onClose={onClose}
      title={result.email}
      eyebrow={t("admin.passwordReset", "Contraseña reiniciada")}
      icon={Key}
      size="md"
      testId="temp-password-modal"
      footer={
        <div className="flex items-center justify-end">
          <button onClick={onClose} className="admin-btn-ghost">{t("admin.close", "Cerrar")}</button>
        </div>
      }
    >
      <p className="text-sm text-neutral-400 mb-3">{t("admin.deliverTempPw", "Entrega esta contraseña temporal al usuario")} ({result.target_type}). {t("admin.tempPwNote", "No se volverá a mostrar.")}</p>
      <div className="flex items-center gap-2 admin-content-card px-4 py-3">
        <code className="flex-1 font-mono text-lg text-emerald-300 tracking-wide">{result.temp_password}</code>
        <button onClick={copy} className="admin-btn-ghost inline-flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" /> {t("admin.copy", "Copiar")}</button>
      </div>
    </PremiumModal>
  );
}

function SupportTab() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [pwResult, setPwResult] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingRevoke, setPendingRevoke] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [resetPrompt, setResetPrompt] = useState(null);
  const { t } = useI18n();

  const load = useCallback(async () => {
    try { const { data } = await adminAPI.supportList(); setReqs(data || []); } catch (e) { err(e); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); const _i = setInterval(load, 10000); return () => clearInterval(_i); }, [load]);

  const forward = useCallback(async (id) => {
     try { await adminAPI.supportForward(id); ok(t("admin.forwardedToSupport", "Reenviado a soporte")); load(); } catch (e) { err(e); }
  }, [load, t]);
  const resolve = useCallback(async (id) => {
    try { await adminAPI.supportResolve(id, ""); ok(t("admin.markedResolved", "Marcado como resuelto")); load(); } catch (e) { err(e); }
  }, [load, t]);

  const resetPassword = useCallback(async (r) => {
    setResetPrompt({ id: r.id, suggested: r.requested_by_email || "" });
  }, []);

  const submitResetPassword = useCallback(async (email) => {
    if (resetPrompt == null) return;
    const r = resetPrompt;
    setResetPrompt(null);
    if (email === "") return;
    setBusyId(r.id);
    try {
      const { data } = await adminAPI.supportResetPassword(r.id, email || undefined);
      setPwResult(data);
      ok(t("admin.passwordResetDone", "Contraseña reiniciada"));
      load();
    } catch (e) { err(e); }
    setBusyId(null);
  }, [resetPrompt, load, t]);

  const revokeToken = useCallback(async () => {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
       const { data } = await adminAPI.supportRevokeToken(pendingRevoke.id);
       ok(`${data.deactivated} ${t("admin.tokensDeactivated", "token(s) desactivado(s)")}`);
      setPendingRevoke(null);
      load();
    } catch (e) { err(e); }
    setRevoking(false);
  }, [pendingRevoke, load, t]);

  const filtered = useMemo(() => {
    if (filter === "all") return reqs;
    if (filter === "open") return reqs.filter((r) => r.status !== "resolved");
    return reqs.filter((r) => r.status === "resolved");
  }, [reqs, filter]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  const statusBadge = (s) => {
    const map = {
      open: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      forwarded: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    };
    return map[s] || map.open;
  };

  return (
    <div>
      {pwResult && <TempPasswordModal result={pwResult} onClose={() => setPwResult(null)} />}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold">{t("admin.helpCenter", "Centro de Ayudas")}</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{t("admin.helpCenterDesc", "Solicitudes de las empresas: reinicio de contraseña, quitar tokens y más.")}</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 p-1">
          {[["open", t("admin.open", "Abiertas")], ["resolved", t("admin.resolved", "Resueltas")], ["all", t("admin.all", "Todas")]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filter === k ? "bg-emerald-500/15 text-emerald-300" : "text-neutral-400 hover:text-white"}`}>{l}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">{t("admin.noRequests", "No hay solicitudes")} {filter === "resolved" ? t("admin.resolved", "resueltas") : filter === "open" ? t("admin.open", "abiertas") : ""}.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="admin-content-card p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <LifeBuoy className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <h3 className="font-bold truncate">{r.company_name || t("admin.company", "Empresa")}</h3>
                    <span className="admin-badge admin-badge-neutral">{t("admin.supportType_" + r.type, SUPPORT_TYPE_LABELS[r.type] || r.type)}</span>
                    <span className={`admin-badge ${statusBadge(r.status)}`}>{r.status}</span>
                  </div>
                  {r.requested_by_email && (
                    <div className="text-[11px] text-neutral-400 mt-1">Solicitado por: <span className="text-neutral-200 font-medium">{r.requested_by_name || r.requested_by_email}</span> · {r.requested_by_email}</div>
                  )}
                  <p className="text-sm text-neutral-300 mt-2 whitespace-pre-wrap">{r.message || t("admin.noMessage", "(sin mensaje)")}</p>
                  {r.resolution_note && <div className="text-[11px] text-emerald-400/80 mt-2">✓ {r.resolution_note}</div>}
                  <div className="text-[11px] text-neutral-500 mt-2 font-mono">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</div>
                </div>
                <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0 flex-wrap">
                  {r.status !== "resolved" && (
                    <>
                      <button disabled={busyId === r.id} onClick={() => resetPassword(r)} className="admin-btn-ghost !border-emerald-500/25 !text-emerald-300 hover:!bg-emerald-500/8 inline-flex items-center gap-1.5 disabled:opacity-50">
                        <Key className="h-3.5 w-3.5" /> {t("admin.resetPassword", "Reiniciar contraseña")}
                      </button>
                      <button disabled={busyId === r.id} onClick={() => setPendingRevoke({ id: r.id, name: r.company_name })} className="admin-btn-ghost !border-red-500/25 !text-red-300 hover:!bg-red-500/8 inline-flex items-center gap-1.5 disabled:opacity-50">
                        <Shield className="h-3.5 w-3.5" /> {t("admin.removeToken", "Quitar token")}
                      </button>
                      <button disabled={busyId === r.id} onClick={() => forward(r.id)} className="admin-btn-ghost !border-blue-500/25 !text-blue-300 hover:!bg-blue-500/8 inline-flex items-center gap-1.5 disabled:opacity-50">
                        <Send className="h-3.5 w-3.5" /> {t("admin.forward", "Reenviar")}
                      </button>
                      <button disabled={busyId === r.id} onClick={() => resolve(r.id)} className="admin-btn-ghost inline-flex items-center gap-1.5 disabled:opacity-50">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.resolve", "Resolver")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!pendingRevoke}
        onClose={() => !revoking && setPendingRevoke(null)}
        onConfirm={revokeToken}
        title={t("admin.removeMonitorTokenTitle", "Quitar token de monitorista")}
        message={pendingRevoke ? `${t("admin.deactivateMonitorTokenMsg", "¿Desactivar el token de monitorista de")} ${pendingRevoke.name || t("admin.thisCompany", "esta empresa")}?` : ""}
        confirmLabel={t("admin.removeToken", "Quitar token")}
        danger
        busy={revoking}
        testId="confirm-revoke-token"
      />
      <PromptDialog
        open={!!resetPrompt}
        onClose={() => setResetPrompt(null)}
        onSubmit={submitResetPassword}
        title={t("admin.resetPasswordTitle", "Reiniciar contraseña")}
        message={t("admin.resetPasswordMsg", "Introduce el correo de la cuenta cuya contraseña quieres reiniciar.")}
        label={t("admin.emailLabel", "Correo electrónico")}
        placeholder="nombre@empresa.com"
        defaultValue={resetPrompt?.suggested || ""}
        submitLabel={t("admin.reset", "Reiniciar")}
        testId="prompt-reset-password"
      />
    </div>
  );
}

function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    const run = (initial) => {
      if (initial) setLoading(true);
      analyticsAPI.overview(days)
        .then((r) => { if (!cancelled) setData(r.data); })
        .catch((e) => { if (!cancelled && initial) err(e); })
        .finally(() => { if (!cancelled && initial) setLoading(false); });
    };
    run(true);
    const _i = setInterval(() => run(false), 10000);
    return () => { cancelled = true; clearInterval(_i); };
  }, [days]);

  const series = useMemo(
    () => (data?.views_by_day || []).map((d) => ({
      label: d.day.slice(5).replace("-", "/"),
      views: d.views,
      unique: d.unique,
    })),
    [data]
  );
  const topPages = data?.top_pages || [];
  const referrers = data?.referrers || [];
  const maxRef = Math.max(1, ...referrers.map((r) => r.views));
  const selCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold">{t("admin.visitAnalytics", "Analítica de visitas")}</h2>
          <p className="text-xs text-neutral-500 mt-1">{t("admin.visitAnalyticsDesc", "Tráfico del sitio web público y del panel.")}</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={selCls}>
          <option value={7}>{t("admin.last7days", "Últimos 7 días")}</option>
          <option value={30}>{t("admin.last30days", "Últimos 30 días")}</option>
          <option value={90}>{t("admin.last90days", "Últimos 90 días")}</option>
          <option value={365}>{t("admin.lastYear", "Último año")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon={Eye} label={t("admin.viewsToday", "Vistas hoy")} value={data?.views_today || 0} accent="emerald" />
            <StatsCard icon={Users} label={t("admin.uniqueVisitorsToday", "Visitantes únicos hoy")} value={data?.unique_today || 0} accent="blue" />
            <StatsCard icon={BarChart3} label={`${t("admin.views", "Vistas")} (${days}d)`} value={data?.total_views || 0} accent="emerald" />
            <StatsCard icon={Globe} label={`${t("admin.uniqueVisitors", "Visitantes únicos")} (${days}d)`} value={data?.unique_visitors || 0} accent="blue" />
          </div>

          <div className="mt-6 admin-content-card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><LineChartIcon className="h-4 w-4 text-emerald-400" /> {t("admin.viewsPerDay", "Vistas por día")}</h3>
              <span className="text-xs text-neutral-500 whitespace-nowrap font-mono">{t("admin.avg", "Promedio")}: <strong className="text-white">{data?.avg_views_per_day || 0}</strong>{t("admin.perDay", "/día")}</span>
            </div>
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#a3a3a3" fontSize={11} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis stroke="#a3a3a3" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0f1114", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10 }} />
                  <Area type="monotone" dataKey="views" name={t("admin.views", "Vistas")} stroke="#10b981" strokeWidth={2} fill="url(#gViews)" />
                  <Area type="monotone" dataKey="unique" name={t("admin.uniques", "Únicos")} stroke="#3b82f6" strokeWidth={2} fill="url(#gUnique)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="admin-content-card p-4 sm:p-5">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4 font-semibold">{t("admin.mostVisitedPages", "Páginas más visitadas")}</h4>
              {topPages.length === 0 ? <div className="text-xs text-neutral-500">{t("admin.noDataPeriod", "Sin datos en el periodo.")}</div> : (
                <div className="space-y-3">
                  {topPages.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-white/4 last:border-0">
                      <span className="font-mono text-xs text-neutral-300 truncate">{p.path}</span>
                       <span className="text-xs whitespace-nowrap font-mono"><strong className="text-white">{p.views}</strong> {t("admin.viewsN", "vistas")} · {p.unique} {t("admin.uniquesN", "únicos")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-content-card p-4 sm:p-5">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4 font-semibold">{t("admin.trafficSources", "Orígenes de tráfico")}</h4>
              {referrers.length === 0 ? <div className="text-xs text-neutral-500">{t("admin.noDataPeriod", "Sin datos en el periodo.")}</div> : (
                <div className="space-y-3">
                  {referrers.map((r, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-3 text-sm mb-1">
                        <span className="text-xs text-neutral-300 truncate">{r.source}</span>
                        <span className="text-xs text-white font-semibold font-mono">{r.views}</span>
                      </div>
                      <div className="admin-progress">
                        <div className="admin-progress-fill bg-emerald-500/70" style={{ width: `${Math.round((r.views / maxRef) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const GEOFENCE_TYPES = [
  { value: "curva", label: "Curva peligrosa" },
  { value: "cruce", label: "Cruce / Intersección" },
  { value: "tunel", label: "Túnel" },
  { value: "escolar", label: "Zona escolar" },
  { value: "obra", label: "Obra / Tramo en reparación" },
  { value: "otro", label: "Otro" },
];

function fmtDuration(seconds) {
  const s = Math.round(seconds || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function MapClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

const EMPTY_ZONE = { name: "", type: "curva", latitude: "", longitude: "", radius_m: 100, note: "", active: true };

function GeofencesTab() {
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_ZONE);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const { t } = useI18n();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([geofencesAPI.list(), geofencesAPI.stats(30)])
      .then(([z, s]) => { setZones(z.data || []); setStats(s.data); })
      .catch(err)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); const _i = setInterval(load, 10000); return () => clearInterval(_i); }, [load]);

  const resetForm = () => { setForm(EMPTY_ZONE); setEditingId(null); };

  const startEdit = (z) => {
    setEditingId(z.id);
    setForm({
      name: z.name, type: z.type, latitude: z.latitude, longitude: z.longitude,
      radius_m: z.radius_m, note: z.note || "", active: z.active,
    });
  };

  const submit = async () => {
    if (!form.name.trim()) return err({ message: t("admin.nameRequired", "El nombre es obligatorio") });
    if (form.latitude === "" || form.longitude === "") return err({ message: t("admin.selectLocation", "Selecciona una ubicación en el mapa") });
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), type: form.type,
        latitude: Number(form.latitude), longitude: Number(form.longitude),
        radius_m: Number(form.radius_m), note: form.note, active: form.active,
      };
      if (editingId) { await geofencesAPI.update(editingId, payload); ok(t("admin.zoneUpdated", "Zona actualizada")); }
      else { await geofencesAPI.create(payload); ok(t("admin.zoneCreated", "Zona creada")); }
      resetForm();
      load();
    } catch (e) { err(e); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await geofencesAPI.remove(id); ok(t("admin.zoneDeleted", "Zona eliminada")); load(); } catch (e) { err(e); }
    setConfirmId(null);
  };

  const center = useMemo(() => {
    if (form.latitude !== "" && form.longitude !== "") return [Number(form.latitude), Number(form.longitude)];
    if (zones.length) return [zones[0].latitude, zones[0].longitude];
    return [19.4326, -99.1332];
  }, [form.latitude, form.longitude, zones]);

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50";
  const perZone = stats?.per_zone || [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-400" /> Geocercas de riesgo</h2>
        <p className="text-sm text-neutral-500 mt-1">Zonas que activan el <strong>modo Precaución</strong> en la app del conductor y elevan la prioridad de triaje ante un impacto.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatsCard icon={ShieldAlert} label="Zonas activas" value={stats?.active_zones || 0} accent="amber" />
            <StatsCard icon={MapPin} label="Entradas (30d)" value={stats?.total_entries || 0} accent="blue" />
            <StatsCard icon={Timer} label="Tiempo total en zonas" value={fmtDuration(stats?.total_seconds)} accent="emerald" />
            <StatsCard icon={Activity} label="Conductores en zona ahora" value={stats?.currently_in_zone || 0} accent="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="admin-content-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold mb-4">{editingId ? "Editar zona" : "Nueva zona de riesgo"}</h3>
              <div className="space-y-3">
                <input className={inputCls} placeholder="Nombre (ej. Curva del kilómetro 12)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {GEOFENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input className={inputCls} type="number" min="10" max="5000" placeholder="Radio (m)" value={form.radius_m} onChange={(e) => setForm({ ...form, radius_m: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className={inputCls} type="number" step="any" placeholder="Latitud" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                  <input className={inputCls} type="number" step="any" placeholder="Longitud" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
                <p className="text-[11px] text-neutral-500">Haz clic en el mapa para fijar el centro de la zona.</p>
                <div className="h-56 rounded-xl overflow-hidden admin-content-card">
                  <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    <MapClickPicker onPick={(lat, lng) => setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))} />
                    {zones.map((z) => (
                      <Circle key={z.id} center={[z.latitude, z.longitude]} radius={z.radius_m} pathOptions={{ color: "#f59e0b", fillOpacity: 0.1 }} />
                    ))}
                    {form.latitude !== "" && form.longitude !== "" && (
                      <Circle center={[Number(form.latitude), Number(form.longitude)]} radius={Number(form.radius_m) || 100} pathOptions={{ color: "#10b981", fillOpacity: 0.2 }} />
                    )}
                  </MapContainer>
                </div>
                <textarea className={inputCls} rows={2} placeholder="Nota (opcional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-emerald-500" /> Activa
                </label>
                <div className="flex gap-2">
                  <button onClick={submit} disabled={saving} className="admin-btn-primary inline-flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {editingId ? "Guardar" : "Crear zona"}
                  </button>
                  {editingId && <button onClick={resetForm} className="admin-btn-ghost">Cancelar</button>}
                </div>
              </div>
            </div>

            <div className="admin-content-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold mb-4">Zonas registradas ({zones.length})</h3>
              {zones.length === 0 ? <div className="text-xs text-neutral-500">Aún no hay zonas. Crea la primera.</div> : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {zones.map((z) => {
                    const stat = perZone.find((p) => p.geofence_id === z.id);
                    return (
                      <div key={z.id} className="admin-content-card !bg-white/[0.02] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{z.name}</span>
                              {!z.active && <span className="admin-badge admin-badge-neutral">inactiva</span>}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {GEOFENCE_TYPES.find((t) => t.value === z.type)?.label || z.type} · {z.radius_m}m · riesgo {z.risk_weight}
                            </div>
                            {stat && <div className="text-[11px] text-amber-400/80 mt-1 font-mono">{stat.entries} entradas · {stat.unique_drivers} conductores · prom. {fmtDuration(stat.avg_seconds)}</div>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => startEdit(z)} className="admin-btn-ghost !px-1.5 !py-1.5"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmId(z.id)} className="admin-btn-ghost !px-1.5 !py-1.5 !border-red-500/25 hover:!bg-red-500/8"><Trash2 className="h-4 w-4 text-red-400" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar zona"
        message="¿Seguro que deseas eliminar esta geocerca de riesgo?"
        confirmLabel="Eliminar"
        onConfirm={() => remove(confirmId)}
        onClose={() => setConfirmId(null)}
        danger
        testId="confirm-delete-geofence"
      />
    </div>
  );
}

function VersionsTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ version: "", platform: "android", download_url: "", notes: "", mandatory: false, published: true, size_mb: null });
  const [apkFile, setApkFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ notes: "", mandatory: false, published: false });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await versionsAPI.list(); setList(data || []); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault(); setBusy(true); setUploading(true); setProgress(0); setError("");
    try {
      let download_url = form.download_url;
      let size_mb = form.size_mb;
      if (apkFile) {
        const { data } = await versionsAPI.uploadApk(apkFile, (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        download_url = data.url;
        if (!size_mb && data.size_mb) size_mb = data.size_mb;
      }
      await versionsAPI.create({ ...form, download_url, size_mb });
      setForm({ version: "", platform: "android", download_url: "", notes: "", mandatory: false, published: true });
      setApkFile(null);
      load(); ok("Versión publicada");
    } catch (er) { setError(formatApiError(er)); }
    setBusy(false); setUploading(false); setProgress(0);
  }, [form, apkFile, load]);

  const togglePublish = useCallback(async (v) => {
    try { await versionsAPI.update(v.id, { published: !v.published }); load(); ok(v.published ? "Versión ocultada" : "Versión publicada"); }
    catch (e) { err(e); }
  }, [load]);

  const toggleMandatory = useCallback(async (v) => {
    try { await versionsAPI.update(v.id, { mandatory: !v.mandatory }); load(); }
    catch (e) { err(e); }
  }, [load]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try { await versionsAPI.remove(pendingDelete.id); setPendingDelete(null); load(); ok("Versión eliminada"); }
    catch (e) { err(e); }
    setDeleting(false);
  }, [pendingDelete, load]);

  const openEdit = useCallback((v) => {
    setEditing(v);
    setEditForm({ notes: v.notes || "", mandatory: !!v.mandatory, published: !!v.published });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await versionsAPI.update(editing.id, { notes: editForm.notes, mandatory: editForm.mandatory, published: editForm.published });
      setEditing(null);
      load();
      ok(editForm.published ? "Versión publicada" : "Versión guardada");
    } catch (e) { err(e); }
    setSavingEdit(false);
  }, [editing, editForm, load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Versiones de la App</h2>
        <p className="text-sm text-neutral-500 mt-1">Sube el archivo APK directamente o pega un enlace de descarga externa. La versión publicada más alta se ofrece en la web y notifica a la app móvil.</p>
      </div>

      <div className="admin-content-card p-4 sm:p-6 mb-6">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Publicar nueva versión</h3>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-3">
          <input value={form.version} onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))} placeholder="Versión (ej. 2.1.0)" required className="admin-input" />
          <select value={form.platform} onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))} className="admin-input">
            <option value="android">Android</option>
            <option value="ios">iOS</option>
            <option value="all">Todas</option>
          </select>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Subir APK</label>
            <input type="file" accept=".apk" onChange={(e) => { setApkFile(e.target.files[0] || null); setForm(f => ({ ...f, size_mb: e.target.files[0] ? Math.round(e.target.files[0].size / (1024 * 1024) * 100) / 100 : null })); }} className="block w-full text-sm text-neutral-300 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-300 hover:file:bg-emerald-500/20 file:cursor-pointer cursor-pointer" />
            {apkFile && <p className="text-xs text-emerald-400">{apkFile.name} ({(apkFile.size / (1024 * 1024)).toFixed(2)} MB)</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-1">O enlace externo</label>
            <input value={form.download_url} onChange={(e) => setForm(f => ({ ...f, download_url: e.target.value }))} placeholder="https://enlace-de-descarga-del-apk" className="admin-input" />
          </div>
          <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Novedades / changelog (opcional)" rows={3} className="admin-input resize-none md:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer py-1"><input type="checkbox" checked={form.mandatory} onChange={(e) => setForm(f => ({ ...f, mandatory: e.target.checked }))} className="accent-emerald-500 flex-shrink-0" /> <span>Actualización obligatoria</span></label>
          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer py-1"><input type="checkbox" checked={form.published} onChange={(e) => setForm(f => ({ ...f, published: e.target.checked }))} className="accent-emerald-500 flex-shrink-0" /> <span>Publicar de inmediato</span></label>
          <div className="md:col-span-2 space-y-3">
            <button disabled={busy || !form.version || (!apkFile && !form.download_url)} className="admin-btn-primary sm:w-auto">{busy ? (uploading ? "Subiendo APK..." : "Publicando...") : "Publicar versión"}</button>
            {uploading && (
              <div className="admin-progress">
                <div className="admin-progress-fill bg-emerald-400" style={{ width: `${progress}%` }} />
              </div>
            )}
            {uploading && <p className="text-xs text-neutral-500 text-right font-mono">{progress}%</p>}
          </div>
        </form>
        {error && <div className="mt-3 text-sm text-red-400 border border-red-500/25 bg-red-500/8 rounded-xl px-3 py-2.5">{error}</div>}
      </div>

      <div className="space-y-3">
        {list.length === 0 && <div className="text-sm text-neutral-500 text-center py-8">Aún no hay versiones publicadas.</div>}
        {list.map((v) => (
          <div key={v.id} className="admin-content-card p-4 flex-col sm:flex-row flex sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center flex-shrink-0"><Smartphone className="h-4 w-4 text-emerald-400" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  v{v.version}
                  <span className="admin-badge admin-badge-neutral">{v.platform}</span>
                  {v.published
                    ? <span className="admin-badge admin-badge-emerald">Publicada</span>
                    : <span className="admin-badge admin-badge-neutral">Borrador</span>}
                  {v.mandatory && <span className="admin-badge admin-badge-amber">Obligatoria</span>}
                </div>
                {v.notes && <div className="text-xs text-neutral-500 truncate max-w-xs sm:max-w-md">{v.notes}</div>}
                <button onClick={() => window.open(`${api.defaults.baseURL}/versions/${v.id}/download`, '_blank')} className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90 hover:text-emerald-200 transition-colors"><Download className="h-3 w-3" /> {v.download_url?.startsWith("/uploads/") ? v.download_url.split("/").pop() : "Descargar"}</button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              <button onClick={() => openEdit(v)} className="admin-btn-ghost" title="Editar descripción">{v.published ? "Editar" : "Revisar"}</button>
              <button onClick={() => toggleMandatory(v)} className="admin-btn-ghost" title="Obligatoria">{v.mandatory ? "Opcional" : "Obligar"}</button>
              <button onClick={() => togglePublish(v)} className="admin-btn-ghost">{v.published ? "Ocultar" : "Publicar"}</button>
              <button onClick={() => setPendingDelete({ id: v.id, version: v.version })} className="admin-btn-ghost !border-red-500/25 hover:!bg-red-500/8" title="Eliminar"><Trash2 className="h-4 w-4 text-red-400" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar versión"
        message={pendingDelete ? `¿Eliminar la versión ${pendingDelete.version}? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        testId="confirm-delete-version"
      />

      <PremiumModal
        open={!!editing}
        onClose={() => !savingEdit && setEditing(null)}
        title={editing ? `Versión v${editing.version}` : "Editar versión"}
        eyebrow="SuperAdmin · Versiones"
        closeOnBackdrop={!savingEdit}
        footer={
          <>
            <button onClick={() => setEditing(null)} disabled={savingEdit} className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 px-4 py-3 text-sm font-semibold text-neutral-300 transition-all disabled:opacity-50">Cancelar</button>
            <button onClick={saveEdit} disabled={savingEdit} className="flex-[1.4] rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold px-4 py-3 text-sm transition-all flex items-center justify-center gap-2">
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editForm.published ? "Publicar" : "Guardar borrador"}
            </button>
          </>
        }
      >
        <div className="space-y-4 w-full">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Novedades / descripción</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Describe qué hay de nuevo en esta versión..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer py-1">
            <input type="checkbox" checked={editForm.published} onChange={(e) => setEditForm((f) => ({ ...f, published: e.target.checked }))} className="accent-emerald-500 flex-shrink-0" />
            <span>Publicar (visible en la web y notifica a la app)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer py-1">
            <input type="checkbox" checked={editForm.mandatory} onChange={(e) => setEditForm((f) => ({ ...f, mandatory: e.target.checked }))} className="accent-amber-500 flex-shrink-0" />
            <span>Marcar como actualización obligatoria</span>
          </label>
          {editing?.download_url && (
            <button onClick={() => window.open(`${api.defaults.baseURL}/versions/${editing.id}/download`, "_blank")} className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90 hover:text-emerald-200">
              <Download className="h-3 w-3" /> Probar descarga ({editing.download_url.startsWith("/uploads/") ? editing.download_url.split("/").pop() : "enlace externo"})
            </button>
          )}
        </div>
      </PremiumModal>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard, Tab: OverviewTab },
  { id: "analytics", label: "Analítica", icon: LineChartIcon, Tab: AnalyticsTab },
  { id: "companies", label: "Empresas", icon: Building2, Tab: CompaniesTab },
  { id: "heatmap", label: "Mapa de Calor", icon: MapIcon, Tab: HeatmapTab },
  { id: "geofences", label: "Geocercas", icon: ShieldAlert, Tab: GeofencesTab },
  { id: "support", label: "Centro de Ayudas", icon: LifeBuoy, Tab: SupportTab },
  { id: "plans", label: "Planes", icon: CreditCard, Tab: PlansTab },
  { id: "versions", label: "Versiones", icon: Package, Tab: VersionsTab },
  { id: "logistics", label: "Logística de Ventas", icon: TrendingUp, Tab: SalesLogisticsTab },
  { id: "superadmins", label: "SuperAdmins", icon: UserPlus, Tab: SuperAdminsTab },
  { id: "audit", label: "Auditoría", icon: ScrollText, Tab: AuditTab },
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
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 block mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="admin-input font-mono pr-12"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs pointer-events-none font-medium">{suffix}</span>}
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

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="admin-content-card p-4 sm:p-6 space-y-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 font-mono">Simulador</div>
          <NumberField label="Conductores (repartidores)" value={drivers} onChange={setDrivers} />
          <NumberField label="Precio B2B por repartidor" value={price} onChange={setPrice} suffix="MXN/mes" />
          <NumberField label="Gastos fijos mensuales" value={fixed} onChange={setFixed} suffix="MXN" />
          <NumberField label="Margen objetivo" value={margin} onChange={setMargin} suffix="%" />
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {loading && <div className="admin-content-card p-6 sm:p-10 flex items-center justify-center text-neutral-500"><Loader2 className="animate-spin" /></div>}
          {error && <div className="border border-red-500/25 bg-red-500/8 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
          {!loading && scenario && (
            <>
              <div className={`admin-content-card p-4 sm:p-6 relative overflow-hidden ${scenario.meets_target_margin ? "" : "ring-1 ring-amber-500/25"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="font-bold font-mono text-sm">Escenario para {drivers} conductores</span>
                  {scenario.meets_target_margin ? (
                    <span className="ml-auto admin-badge admin-badge-emerald">Rentable</span>
                  ) : (
                    <span className="ml-auto admin-badge admin-badge-amber">Bajo margen</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Ingreso/mes</div>
                    <div className="font-mono font-bold text-base sm:text-lg mt-1 tabular-nums">{mxn(scenario.monthly_revenue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Utilidad/mes</div>
                    <div className="font-mono font-bold text-base sm:text-lg mt-1 text-emerald-400 tabular-nums">{mxn(scenario.monthly_profit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Margen</div>
                    <div className="font-mono font-bold text-base sm:text-lg mt-1 tabular-nums">{scenario.margin_pct}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">ROI hardware</div>
                    <div className="font-mono font-bold text-base sm:text-lg mt-1 tabular-nums">{scenario.roi_months != null ? `${scenario.roi_months} meses` : "—"}</div>
                  </div>
                </div>
              </div>

              <div className="admin-content-card p-4 sm:p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 font-mono mb-3">Capacidad ofrecible a empresas</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="admin-content-card !bg-white/[0.02] p-4">
                    <div className="text-neutral-500 text-xs">Punto de equilibrio</div>
                    <div className="font-mono font-bold text-lg mt-1 tabular-nums">{b2b.breakeven_drivers} <span className="text-sm text-neutral-500 font-normal">conductores</span></div>
                    <div className="text-[11px] text-neutral-500 mt-1">Para cubrir gastos fijos.</div>
                  </div>
                  <div className="admin-content-card !bg-white/[0.02] p-4">
                    <div className="text-neutral-500 text-xs">Margen objetivo ({margin}%)</div>
                    <div className="font-mono font-bold text-lg mt-1 tabular-nums">{b2b.min_drivers_for_target_margin} <span className="text-sm text-neutral-500 font-normal">conductores</span></div>
                    <div className="text-[11px] text-neutral-500 mt-1">Mínimo para tu margen.</div>
                  </div>
                  <div className="admin-content-card !bg-emerald-500/5 !border-emerald-500/20 p-4">
                    <div className="text-neutral-500 text-xs">Oferta recomendada</div>
                    <div className="font-mono font-bold text-lg mt-1 text-emerald-400 tabular-nums">Desde {b2b.recommended_min_drivers}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">Conductores a buen precio.</div>
                  </div>
                </div>
              </div>

              <div className="admin-content-card p-4 sm:p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 font-mono mb-3">Escenarios de referencia</div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="admin-table w-full text-sm min-w-[500px]">
                    <thead>
                      <tr>
                        <th>Conductores</th>
                        <th>Ingreso/mes</th>
                        <th>Utilidad/mes</th>
                        <th>Margen</th>
                        <th>ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b2b.scenarios.map((s) => (
                        <tr key={s.drivers}>
                          <td className="font-mono tabular-nums">{s.drivers}</td>
                          <td className="font-mono tabular-nums">{mxn(s.monthly_revenue)}</td>
                          <td className="font-mono text-emerald-400 tabular-nums">{mxn(s.monthly_profit)}</td>
                          <td className="font-mono tabular-nums">{s.margin_pct}%</td>
                          <td className="font-mono tabular-nums">{s.roi_months != null ? `${s.roi_months}m` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {b2c && (
                <div className="admin-content-card p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-emerald-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 font-mono">Lado B2C (usuario final)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div><div className="text-neutral-500 text-xs">Suscripción/mes</div><div className="font-mono font-bold mt-1 tabular-nums">{mxn(b2c.subscription)}</div></div>
                    <div><div className="text-neutral-500 text-xs">Dispositivo</div><div className="font-mono font-bold mt-1 tabular-nums">{mxn(b2c.device_price)}</div></div>
                    <div><div className="text-neutral-500 text-xs">Margen dispositivo</div><div className="font-mono font-bold mt-1 text-emerald-400 tabular-nums">{b2c.device_margin_pct}%</div></div>
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

function SuperAdminsTab() {
  const { user } = useAuth();
  const isRoot = !!user?.is_root;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await superAdminAPI.list(); setList(data || []); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await superAdminAPI.create(email, password, name);
      setCreatedToken({ email, token: data.site_token });
      setEmail(""); setPassword(""); setName(""); load();
      ok("SuperAdmin creado");
    } catch (err) { setError(formatApiError(err)); }
    setBusy(false);
  }, [email, password, name, load]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try { await superAdminAPI.remove(pendingDelete.id); setPendingDelete(null); load(); ok("SuperAdmin eliminado"); }
    catch (err) { toast.error(formatApiError(err)); }
    setDeleting(false);
  }, [pendingDelete, load]);

  const copyToken = (tok) => {
    try { navigator.clipboard.writeText(tok); ok("Token copiado"); } catch {}
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">SuperAdmins</h2>
        <p className="text-sm text-neutral-500 mt-1">
          {isRoot
            ? "Como cuenta principal (.env), puedes crear y eliminar SuperAdmins. Cada uno recibe un token de acceso propio."
            : "Solo la cuenta principal (.env) puede crear o eliminar SuperAdmins."}
        </p>
      </div>

      {isRoot && (
        <div className="admin-content-card p-4 sm:p-6 mb-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Crear nuevo SuperAdmin</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="admin-input" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required className="admin-input" />
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (8+ caracteres)" required className="admin-input" />
            <button disabled={busy || !email || !password} className="admin-btn-primary">{busy ? "Creando..." : "Crear"}</button>
          </form>
          {error && <div className="mt-3 text-sm text-red-400 border border-red-500/25 bg-red-500/8 rounded-xl px-3 py-2.5">{error}</div>}
        </div>
      )}

      <div className="space-y-3">
        {list.map((s) => (
          <div key={s.id || s.email} className="admin-content-card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center flex-shrink-0"><Shield className="h-4 w-4 text-red-400" /></div>
              <div className="min-w-0">
                <div className="font-bold flex items-center gap-2">
                  {s.name}
                  {s.is_root && <span className="admin-badge admin-badge-amber">Principal</span>}
                </div>
                <div className="text-xs text-neutral-500 truncate font-mono">{s.email}</div>
                {isRoot && s.site_token && (
                  <button onClick={() => copyToken(s.site_token)} className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-300/90 hover:text-emerald-200 transition-colors" title="Copiar token de acceso">
                    <Key className="h-3 w-3" /> {s.site_token} <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            {isRoot && !s.is_root && (
              <button onClick={() => setPendingDelete({ id: s.id, name: s.name })} className="admin-btn-ghost !border-red-500/25 hover:!bg-red-500/8 flex-shrink-0" title="Eliminar"><Trash2 className="h-4 w-4 text-red-400" /></button>
            )}
          </div>
        ))}
      </div>

      <PremiumModal open={!!createdToken} onClose={() => setCreatedToken(null)} title="SuperAdmin creado" testId="superadmin-created-modal">
        {createdToken && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-300">
              Comparte este <strong>token de acceso</strong> con <span className="font-mono text-emerald-300">{createdToken.email}</span>. Lo ingresará en la puerta de acceso del panel para luego iniciar sesión con su contraseña.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <span className="font-mono text-lg tracking-widest text-emerald-300">{createdToken.token}</span>
              <button onClick={() => copyToken(createdToken.token)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"><Copy className="h-3.5 w-3.5" /> Copiar</button>
            </div>
            <p className="text-[11px] text-neutral-500">Guárdalo ahora; por seguridad no se vuelve a mostrar en texto completo salvo aquí.</p>
          </div>
        )}
      </PremiumModal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar SuperAdmin"
        message={pendingDelete ? `¿Eliminar a ${pendingDelete.name || "este SuperAdmin"}? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        testId="confirm-delete-sa"
      />
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try { const { data } = await superAdminAPI.audit(); setLogs(data || []); } catch {}
      setLoading(false);
    };
    run();
    const _i = setInterval(run, 10000);
    return () => clearInterval(_i);
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Auditoría de acciones</h2>
        <p className="text-sm text-neutral-500 mt-1">Registro de actividades recientes del sistema</p>
      </div>
      {logs.length === 0 ? (
        <div className="text-neutral-500 text-sm text-center py-12">Sin acciones registradas todavía.</div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="admin-content-card p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/8 flex items-center justify-center flex-shrink-0"><Activity className="h-4 w-4 text-emerald-400" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{l.action}</div>
                <div className="text-xs text-neutral-500 truncate">{l.detail}{l.actor ? ` · ${l.actor}` : ""}</div>
              </div>
              <div className="text-[11px] text-neutral-500 whitespace-nowrap font-mono">{new Date(l.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("crash_admin_sidebar") === "1");

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("crash_admin_sidebar", next ? "1" : "0");
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const ActiveComponent = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab);
    return tab?.Tab || OverviewTab;
  }, [activeTab]);

  const activeLabel = useMemo(() => TABS.find(t => t.id === activeTab)?.label || "", [activeTab]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex relative">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-[0.35]" />
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/[0.06] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-500/[0.05] blur-[120px]" />

      <aside className={`relative z-10 ${collapsed ? "w-[76px]" : "w-64"} admin-sidebar p-3 flex-col flex-shrink-0 hidden lg:flex sticky top-0 h-screen transition-[width] duration-300 ease-out`}>
        <button onClick={() => navigate("/")} className={`flex items-center gap-3 mb-5 px-1 w-full text-left ${collapsed ? "justify-center" : ""}`}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/25 to-red-500/5 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)] flex-shrink-0 transition-transform duration-300 hover:scale-105">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.35em] text-neutral-500 leading-tight">SuperAdmin</div>
              <div className="text-base font-bold leading-tight tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">C.R.A.S.H.</div>
            </div>
          )}
        </button>

        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expandir menú" : "Ocultar menú"}
          className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/5 border border-white/8 transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> <span className="opacity-70">Ocultar menú</span></>}
        </button>

        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-0.5">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={collapsed ? tab.label : undefined} className={`admin-nav-item ${active ? "active" : ""} w-full flex items-center gap-3 rounded-xl text-sm ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}`}>
                <tab.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                {!collapsed && <span className="truncate font-medium">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/6 pt-3 mt-2 space-y-2 flex-shrink-0">
          {!collapsed && <div className="text-[11px] text-neutral-500 px-3 truncate font-mono">{user?.email}</div>}
          <button onClick={handleLogout} title={collapsed ? "Cerrar sesión" : undefined} className={`w-full flex items-center gap-3 rounded-xl text-sm text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all duration-200 ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}`}>
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 min-w-0 overflow-y-auto">
        {/* Mobile header + horizontal tabs */}
        <div className="lg:hidden sticky top-0 z-20">
          <div className="bg-black/70 backdrop-blur-2xl border-b border-white/6">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                  <Shield className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 leading-none font-medium">SuperAdmin</div>
                  <div className="font-bold text-sm leading-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">{activeLabel}</div>
                </div>
              </button>
              <button onClick={handleLogout} className="h-9 w-9 rounded-xl border border-red-500/20 flex items-center justify-center hover:bg-red-500/8 transition-all duration-200 active:scale-95">
                <LogOut className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
          <div className="relative bg-black/50 backdrop-blur-xl border-b border-white/6">
            <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 no-scrollbar scroll-smooth">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`admin-mobile-pill ${activeTab === t.id ? "active" : ""} flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium whitespace-nowrap`}>
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-black/60 to-transparent" />
          </div>
        </div>
        {/* Desktop section header */}
        <div className="hidden lg:flex items-center justify-between sticky top-0 z-20 bg-black/40 backdrop-blur-2xl border-b border-white/6 px-8 py-4">
          <div className="admin-section-header">
            {(() => { const T = TABS.find(t => t.id === activeTab); const I = T?.icon; return I ? <div className="admin-section-icon"><I className="h-4.5 w-4.5" /></div> : null; })()}
            <div>
              <div className="text-[9px] uppercase tracking-[0.35em] text-neutral-500 leading-none font-medium">Panel de control</div>
              <div className="text-lg font-bold leading-tight tracking-tight mt-1">{activeLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse-soft" /> Sistema operativo
          </div>
        </div>
        <div key={activeTab} className="p-4 sm:p-6 lg:p-8 page-enter admin-stagger">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

export default memo(AdminPanel);
