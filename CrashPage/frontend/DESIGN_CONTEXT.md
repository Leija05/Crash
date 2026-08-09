# C.R.A.S.H. — Web App Design Context

> Contexto completo de la **página web** (panel de monitoreo + landing) para rediseñarla
> y que se vea **mucho más premium**. Pégale este archivo, junto con capturas de pantalla
> actuales, a una IA de diseño/código. Incluye al final un **prompt listo para usar**.

---

## 1. Qué es la web

**C.R.A.S.H.** es un sistema de **detección de accidentes para motociclistas / EPP (cascos)**.
Un dispositivo con sensores (Arduino Nano + MPU-6050) detecta impactos, una IA clasifica la
gravedad, y se envían alertas automáticas (WhatsApp + panel) con GPS a contactos y a un
**centro de monitoreo**.

La web tiene dos caras:
1. **Landing pública** — presentación del proyecto (evento InnovaTecNM 2026), problema,
   solución, arquitectura, features, precios (B2C/B2B), equipo y contacto.
2. **Aplicación (panel)** — monitoreo en tiempo real de flotillas: mapa en vivo, lista de
   conductores, telemetría, centro de alertas, historial de accidentes y panel de superadmin.

**Tono deseado:** centro de control tácticoo/operacional de alta gama — confiable, urgente
cuando toca, sofisticado, "mission control" para emergencias. Data-dense pero legible de un vistazo.

---

## 2. Stack técnico (respetar al rediseñar)

- **Framework:** React 19 + Create React App (**Craco**) — NO Next.js
- **Routing:** `react-router-dom` v7 (rutas en `src/App.js`)
- **Estilos:** **Tailwind CSS v3** + variables CSS + clases custom en `src/index.css`
- **Componentes base:** **shadcn/ui** (Radix UI) en `src/components/ui/*`
- **Animación:** **framer-motion** (transiciones de página, entradas, hover/tap)
- **Iconos:** **lucide-react**
- **Gráficas:** **recharts** (barras, pie, líneas)
- **Mapas:** **Leaflet** + `react-leaflet` (basemap oscuro Carto)
- **Notificaciones:** **sonner** (toasts)
- **Realtime:** WebSocket propio (`src/lib/ws.js`), API con axios (`src/lib/api.js`)
- **i18n:** Español / Inglés (`src/i18n/`)

> Cualquier propuesta debe ser implementable con **Tailwind + shadcn/ui + framer-motion**.
> Nada de otros frameworks CSS. Los tokens shadcn viven como CSS vars `hsl(var(--...))`.

---

## 3. Sistema de diseño actual

### Estética
**Dark tactical**: negro profundo (`#0A0A0A`) con acentos **rojo** (peligro/impacto) y
**esmeralda** (OK/atendido), más **ámbar** (advertencia). Glassmorphism (blur 24px),
glows de color, bordes con gradiente animado, fondo con radiales rojo/esmeralda a la deriva.

### Paleta
| Rol | Color |
|---|---|
| Fondo app | `#0A0A0A` / `#0d0d0f` |
| Fondo auth | `#050505` |
| Texto | `#f5f5f5` / neutrales |
| **Rojo (peligro/impacto)** | `#EF4444` (rgba 239,68,68) |
| **Esmeralda (OK/atendido)** | `#10B981` (rgba 16,185,129) |
| **Ámbar (advertencia)** | `#F59E0B` (rgba 245,158,11) |
| Glass bg / border | `rgba(255,255,255,0.03)` / `rgba(255,255,255,0.07)` |
| Glass blur | `24px` |

**Severidad de impacto:** esmeralda (leve) → amarillo (medio) → naranja (alto) → rojo (crítico).

### Tipografía
- **Headings:** `Chivo` (700–900, tracking negativo `-0.02em`)
- **Body:** `IBM Plex Sans`
- **Mono / datos tácticos:** `JetBrains Mono` (con `tabular-nums`)

### Tokens y transición
- `--radius` (shadcn: lg/md/sm), radios grandes (rounded-2xl / 3xl en paneles)
- `--transition-premium: 400ms cubic-bezier(0.16, 1, 0.3, 1)` (curva "premium" estándar)
- Sistema de color shadcn vía `hsl(var(--background/foreground/primary/...))` en `tailwind.config.js`

### Clases custom clave (`src/index.css`, 738 líneas)
**Superficies:** `glass-card`, `glass-card-emerald`, `glass-card-red`, `card-glass-strong`,
`card-premium`, `backdrop-premium`, `red-accent-panel` (borde rojo inset).
**Bordes/glows/texto:** `gradient-border(-slow)`, `gradient-text(-red/-amber)`, `text-gradient`,
`glow-emerald`, `glow-red`, `border-glow-red`, `avatar-ring`.
**Botones:** `brand-chip`, `btn-solid`, `btn-ghost`, `btn-danger`.
**Animaciones:** `breathe-animation`, `float-animation`, `glow-pulse`, `alert-flashing`,
`pulse-critical`, `pulse-safe`, `panel-entrance`, `reveal(-delay-1..5)`, `orb-float(-2/-3)`,
`grid-pan`, `shimmer-border`, `marquee-track`, `helmet-shake`, `live-ring`, `animate-spin-slow`.
**Layout/patrones:** `grid-grain`, `grid-bg`, `divider-gradient`, `hr-soft`, `skeleton(-premium)`,
`hover-lift`, `hover-scale`, `card-3d(-inner)` (tilt 3D), `no-scrollbar`, `tabular-nums`.
**Mapa:** `crash-marker` (+ `.active/.warning/.critical/.offline/.pulse`), `crash-impact-halo`,
Leaflet oscuro custom.
**Tema claro:** overrides bajo `body[data-theme='light']`. Respeta `prefers-reduced-motion`.

---

## 4. Estructura de archivos

```
src/
├── App.js                      # Rutas + page transitions (framer-motion) + Toaster
├── index.css                   # Design system (738 líneas de CSS custom) ← CLAVE
├── App.css
├── pages/
│   ├── Landing.js              # Landing pública (1211 líneas): hero, problema, solución,
│   │                           #   arquitectura, features, precios B2C/B2B, equipo, contacto
│   ├── Login.js                # Auth en 2 pasos: "Token Gate" + login/registro
│   ├── Dashboard.js            # Panel principal de monitoreo (layout 3-6-3)
│   ├── History.js              # Historial de accidentes por conductor (mapa + replay)
│   └── AdminPanel.js           # Panel superadmin (2180 líneas): empresas, planes, tokens,
│                               #   heatmap, soporte, webhooks, reportes
├── components/
│   ├── Topbar.js               # Header/command bar del panel
│   ├── DriverList.js           # Roster de conductores (ordenado por severidad)
│   ├── LiveMap.js              # Mapa Leaflet en vivo (markers, heatmap, zonas de riesgo)
│   ├── TelemetryBento.js       # Bento 2x2: BT, velocidad, fuerza-G, GPS/batería
│   ├── AlertsCenter.js         # Consola de alertas (Activas / Historial) + workflow
│   ├── DriverDetailSheet.js    # Ficha del conductor (perfil médico, contactos)
│   ├── CrashHistoryModal.js    # Modal full-screen: todos los crashes + mapa filtrable
│   ├── SystemHealthPanel.js    # Salud del sistema (GPS, telemetría, batería, WS)
│   ├── DashboardStats.js       # Tarjetas de stats + barra de severidad 7 días
│   ├── CrashStatsWidget.js     # Modal de analítica avanzada (recharts + risk map)
│   ├── IncidentCommandCenter.js# Modal full-screen de operación de incidente activo
│   ├── AlertDiagnosis.js       # Diagnóstico IA colapsable (lesiones, primeros auxilios)
│   ├── SettingsModal.js        # Preferencias (tema, idioma, sonido, umbral G)
│   ├── ExportModal.js          # Exportar impactos a CSV
│   ├── CrashLogo.js            # Marca C.R.A.S.H. (SVG) + wordmark
│   ├── ConfirmDialog.js / PromptDialog.js / ErrorBoundary.js
│   └── ui/                     # shadcn/ui (Radix): button, dialog, sheet, table, tabs,
│                               #   select, tooltip, ... (~50 primitivos) + Modal.js (PremiumModal)
├── auth/ (AuthContext.js, ProtectedRoute.js)
├── context/SettingsContext.js
├── hooks/ (use-toast, useCloseOnBrowserBack, usePushNotifications)
├── lib/ (api.js, ws.js, sound.js, utils.js)
└── i18n/ (es.js, en.js, index.js)
```

---

## 5. Pantallas en detalle (para el rediseño)

### Landing (`pages/Landing.js`) — pública
Hero con parallax (framer-motion `useScroll`/`useTransform`), orbes flotantes, grid de fondo.
Secciones: 3 pilares (App móvil / Backend-dispositivo / Dashboard), problema (3 cards),
propuesta de valor (3), arquitectura (4 capas), features (6, con iconos), normas (NOM/ISO/ANSI),
**precios** B2C (dispositivo $1,499 + sub $49) y B2B (dispositivo $1,999 + $150/conductor) con
selector de ciclo, equipo, y contacto (WhatsApp/email). Scroll-reveal (`reveal-*`), marquee.

### Login (`pages/Login.js`) — auth
Dos etapas: **Token Gate** (valida token `XXXX-XXXX-XXXX-XXXX`, muestra rol y usos) → formulario
login/registro. Fondo `#050505` con `grid-grain` + glows radiales rojo/esmeralda. Panel
`card-glass-strong`, entrada staggered, botón blanco sólido, toggle mostrar contraseña.

### Dashboard (`pages/Dashboard.js`) — panel principal
**Layout de 12 columnas: 3 / 6 / 3.**
- **Izquierda (3):** `DriverList` (flota ordenada por severidad) + `SystemHealthPanel` + botón soporte.
- **Centro (6):** `LiveMap` (mapa Leaflet en vivo, toggle mapa de calor) + `TelemetryBento` (2x2).
- **Derecha (3):** `AlertsCenter` (tabs Activas/Historial, workflow de emergencia).
Header `Topbar` arriba. Modales: `DriverDetailSheet`, `CrashHistoryModal`, `SupportModal`.
Todo con `glass-card backdrop-premium`, entradas framer-motion escalonadas.

### History (`pages/History.js`) — por conductor
Mapa (2/3) con ruta GPS + markers de impacto + **replay de accidente** (scrubber Play/Pause,
lecturas de velocidad/G en vivo). Lista de eventos (1/3) con `AlertDiagnosis` embebido.

### AdminPanel (`pages/AdminPanel.js`) — superadmin
Tabs: Overview (stats), Empresas (CRUD, tokens, suscripciones, webhooks Slack/WhatsApp,
reportes programados), Planes, Alertas de token, **Heatmap** de impactos, Soporte. Cards
`bg-white/[0.03] rounded-2xl` con hover-lift y barra de acento lateral; modales glass.

### Modales / paneles especiales
- **PremiumModal** (`ui/Modal.js`): overlay `bg-black/80 backdrop-blur-md`, card `#0B0B0D`
  con glow de marca, logo, close, footer. Base de casi todos los modales. Acento configurable
  (emerald/red/amber), tamaños sm–full, cierre por backdrop/Escape/back del navegador.
- **IncidentCommandCenter**: modal full-screen de incidente activo (checklist, replay,
  salud del sistema, bitácora colaborativa, tiempos de respuesta, botones 911).
- **CrashStatsWidget**: analítica avanzada (recharts + mapa de nodos de riesgo, auto-refresh 10s).

---

## 6. Datos que se visualizan
- **Telemetría en vivo:** estado Bluetooth del casco, velocidad (km/h), **fuerza-G**, GPS,
  batería (%), estado del conductor (crítico/warning/activo/offline).
- **Alertas/impactos:** severidad, probabilidad de lesión, diagnóstico IA, ubicación, estado
  (pendiente/atendido/falsa alarma), notificación a contactos.
- **Perfil médico:** tipo de sangre, alergias, condiciones, discapacidades, notas, contactos.
- **Flota/empresa:** conductores en vivo + roster, tokens, suscripciones, salud del sistema.

---

## 7. PROMPT LISTO PARA LA IA DE DISEÑO

> Copia todo lo de arriba + el siguiente prompt (y adjunta capturas de la web actual).

```
Eres un diseñador de producto senior especializado en dashboards de "mission control" y
sistemas SaaS premium (estilo Linear, Vercel, Arc, Palantir, paneles automotrices de lujo).

CONTEXTO: Arriba tienes el análisis completo de "C.R.A.S.H.", una web React (CRA + Tailwind +
shadcn/ui + framer-motion + Leaflet + recharts) para monitoreo de accidentes de motociclistas
en tiempo real. Estética actual: dark tactical negro con acentos rojo/esmeralda/ámbar y
glassmorphism.

OBJETIVO: Rediseñar la web para que se vea MUCHO MÁS PREMIUM, manteniendo la identidad
(dark + rojo peligro + esmeralda OK) y el stack técnico (Tailwind + shadcn/ui + framer-motion;
nada de otros frameworks). El resultado debe implementarse editando tokens en index.css /
tailwind.config.js y refinando los componentes existentes.

ENTREGA, en este orden:
1. DIRECCIÓN DE DISEÑO: 2–3 conceptos de dirección visual (mood, referencias, por qué encaja
   con un sistema de emergencias de gama alta). Elige y justifica UNA recomendada.
2. SISTEMA DE DISEÑO REFINADO:
   - Paleta exacta (hex + rgba + variables CSS/hsl para shadcn), incluyendo escala de neutrales
     y estados (peligro/OK/advertencia/info) con niveles de intensidad.
   - Tipografía (mantener Chivo/IBM Plex/JetBrains o proponer alternativa premium), escala tipográfica.
   - Espaciado, radios, elevación/sombras, glows y bordes (define un sistema coherente, no ad-hoc).
   - Reglas de glassmorphism (blur, opacidad, borde, highlight) más refinadas.
   - Micro-interacciones y curvas de animación (framer-motion): entradas, hover, estados de datos,
     estado crítico/emergencia.
3. LAYOUT: mejoras al grid del Dashboard (3-6-3), jerarquía visual, densidad de datos legible,
   y cómo destacar el mapa y las alertas críticas sin saturar.
4. COMPONENTES CLAVE rediseñados (describe el "antes → después" y da clases Tailwind concretas
   o snippets JSX cuando sea útil) para: Topbar, DriverList, LiveMap overlays, TelemetryBento,
   AlertsCenter, PremiumModal, tarjetas de stats, y el estado de "emergencia activa".
5. ESTADO DE EMERGENCIA: cómo debe transformarse la UI cuando hay un impacto crítico
   (urgente pero sofisticado, rojo controlado, no chillón).
6. LANDING: cómo elevar el hero y las secciones a nivel showcase premium.
7. ACCESIBILIDAD: contraste, foco, prefers-reduced-motion, legibilidad de números.

RESTRICCIONES: Implementable con Tailwind v3 + shadcn/ui + framer-motion + lucide-react +
recharts + Leaflet. Da valores concretos (hex, px, ms, clases), no descripciones vagas.
Mantén soporte de tema claro/oscuro e i18n ES/EN.
```
</content>
</invoke>
