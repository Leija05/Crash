# C.R.A.S.H. — Design Context

> Contexto completo para rediseñar la app con una estética **más premium**.
> Pégale este archivo a una IA de diseño (o de código) junto con capturas de pantalla actuales.

---

## 1. Qué es la app

**C.R.A.S.H.** es una app de **detección de accidentes para motociclistas**.
Un casco/circuito con sensores (acelerómetro, giroscopio, GPS) envía telemetría por
**Bluetooth Low Energy (BLE)** al teléfono. La app monitorea la fuerza G en tiempo real
y, ante un impacto, dispara una **cuenta regresiva de emergencia** que notifica a
contactos con la ubicación del usuario si no se cancela.

**Público objetivo:** motociclistas. Debe sentirse **tecnológica, confiable, de gama alta**
(tipo dashboard automotriz de lujo / instrumento de precisión), legible en movimiento y de un vistazo.

---

## 2. Stack técnico (respetar al rediseñar)

- **Framework:** Expo SDK 54 + React Native 0.81 + TypeScript
- **Routing:** `expo-router` (file-based, carpeta `app/`)
- **Animación:** `react-native-reanimated` (v4), `Animated` de RN
- **Efectos visuales:** `expo-blur` (glassmorphism), `expo-linear-gradient`, `react-native-svg`
- **Estado global:** React Context (sin Redux)
- **Gráficas:** componentes SVG propios (`src/components/Charts.tsx`)
- **Iconos:** `@expo/vector-icons` (Ionicons)
- **i18n:** Español / Inglés (`src/i18n/`)

Cualquier propuesta de diseño debe ser implementable con estas librerías (nada de CSS web,
Tailwind, styled-components; se usa `StyleSheet` de RN y tokens del theme).

---

## 3. Sistema de diseño actual (`src/theme.ts`)

### Estética
**Dark luxury**: negro profundo + **oro** como acento único, glassmorphism, glows dorados,
gradientes metálicos. Inspiración: instrumentación premium / marca de lujo.

### Paleta
| Token | Valor | Uso |
|---|---|---|
| `bg` | `#0A0A0A` | Fondo principal |
| `bgElevated` | `#000000` | Fondo más profundo |
| `surface` / `surfaceAlt` | `#0D0D0D` / `#111111` | Tarjetas base |
| `elevated` | `#1A1A1A` | Superficies elevadas |
| `text` | `#FFFFFF` | Texto principal |
| `textSec` | `#D8D2C4` | Texto secundario (cálido) |
| `textDim` | `#8C8674` | Texto tenue |
| **GOLD** | `#D9B45B` | Acento primario |
| GOLD_LIGHT / DARK / DEEP | `#F0D89A` / `#A87E2E` / `#6E5214` | Variantes de oro |
| GOLD_GRADIENT | `#F3DEA6 → #E0BE6E → #C29A3E → #8C6824` | Oro metálico (botones/iconos activos) |
| `success` | `#34C759` | |
| `warning` | `#FF9500` | |
| `info` | `#5AC8FA` | |
| `danger` | `#FF3B30` | Alertas/impacto crítico |

**Glass:** `glassBg` `rgba(10,10,10,0.85)`, `glassBorder` `rgba(217,180,91,0.10)`,
más variantes `*Strong`. Hairline dorado en el borde superior de las tarjetas.

**Severidad por fuerza G:**
| Nivel | Rango | Color |
|---|---|---|
| ESTABLE | 0–5 G | verde `#34C759` |
| MEDIO | 5–10 G | amarillo `#FFD700` |
| ALTO | 10–15 G | naranja `#FF9500` |
| CRÍTICO | 15+ G | rojo `#FF3B30` |

### Escalas
- **Radius:** xs 4 · sm 8 · md 12 · lg 18 · xl 24 · xxl 32 · pill 999
- **Spacing:** xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48
- **Font size:** xs 9 · sm 10 · md 13 · lg 15 · xl 18 · xxl 24 · xxxl 32 · display 48 · hero 64
- **Fuentes:** iOS System; Android `sans-serif-condensed` (headings) / `sans-serif` (body) / `monospace`
- **Sombras/glows:** `SHADOWS` con niveles xs–xl y helpers `glow(color)`, `goldGlow`, `redGlow`
- **Animación:** fast 180ms · normal 260ms · slow 420ms · springs (stiffness/damping)

### Patrón de componente base
`GlassCard`: borde 1px dorado translúcido, `borderRadius: lg`, highlight hairline dorado
arriba, variantes `default | elevated | accent | danger`, entrada animada `FadeIn` con spring.

---

## 4. Estructura de archivos

```
app/                              # Rutas (expo-router)
├── _layout.tsx                   # Root: providers globales
├── index.tsx                     # Splash / entrada
├── login.tsx                     # Login
├── register.tsx                  # Registro
├── devices.tsx                   # Escaneo y conexión BLE del casco
├── (tabs)/
│   ├── _layout.tsx               # Tab bar custom (blur + pill dorado animado)
│   ├── index.tsx                 # DASHBOARD (pantalla principal, telemetría en vivo)
│   ├── impacts.tsx               # Historial de impactos
│   ├── contacts.tsx              # Contactos de emergencia
│   ├── profile.tsx               # Perfil / datos médicos (tipo sangre, etc.)
│   └── settings.tsx              # Ajustes
├── impact/[id].tsx               # Detalle de un impacto
└── replay/[id].tsx               # Reproducción de la telemetría del impacto

src/
├── theme.ts                      # Tokens de diseño (fuente de verdad)
├── components/
│   ├── GlassCard.tsx             # Tarjeta glassmorphism (base de todo)
│   ├── GlassButton.tsx           # Botón premium
│   ├── ScreenShell.tsx           # Contenedor de pantalla
│   ├── SectionHeader.tsx         # Encabezado de sección
│   ├── GForceRing.tsx            # Anillo animado de fuerza G (protagonista del dashboard)
│   ├── MetricTile.tsx            # Tile de métrica individual
│   ├── Charts.tsx                # LineChart, MultiLineChart, Sparkline (SVG)
│   ├── GPSMap.tsx                # Mapa de ubicación
│   ├── SeverityBadge.tsx         # Badge de severidad
│   ├── FullScreenAlert.tsx       # Alerta de emergencia a pantalla completa
│   ├── StickyNotification.tsx    # Notificación fija superior
│   ├── PremiumModal.tsx          # Modal reutilizable
│   ├── FloatingActionButton.tsx  # FAB
│   ├── MediaControls.tsx         # Controles de reproducción (replay)
│   ├── DarkSwitch.tsx            # Toggle custom
│   ├── CrashLogo.tsx             # Logo / CrashLogoMark
│   ├── SeverityBadge.tsx
│   └── UpdateGate.tsx / UpdateDownloader.tsx  # Actualizaciones OTA/APK
├── context/
│   ├── AuthContext.tsx           # Sesión / usuario
│   ├── BluetoothContext.tsx      # Conexión + telemetría en vivo
│   ├── LocationContext.tsx       # GPS / permisos / tracking
│   ├── AlertContext.tsx          # Alertas y confirmaciones
│   ├── AppSettingsContext.tsx    # Ajustes de la app
│   └── TabBarContext.tsx         # Ocultar/mostrar tab bar al hacer scroll
├── hooks/useEmergencyAlert.ts
├── services/
│   ├── bluetooth.ts              # BLE (react-native-ble-plx), parseo de telemetría
│   ├── api.ts                    # Backend (auth, impacts, contacts, settings, telemetry)
│   ├── foregroundService.ts      # Servicio en primer plano
│   ├── foregroundTelemetryService.ts
│   └── geofenceService.ts
├── i18n/ (es.ts, en.ts, index.tsx)
├── native/ApkInstaller.ts
└── utils/haptics.ts
```

---

## 5. Modelo de datos (para diseñar visualizaciones)

**Telemetría en vivo (`TelemetryData`):**
```ts
acceleration_x, acceleration_y, acceleration_z   // m/s²
gyroscope_x, gyroscope_y, gyroscope_z            // °/s
g_force                                           // fuerza G (métrica estrella)
battery        // 0–100 (%)
critical       // boolean, impacto detectado
latitude, longitude, speed_kmh                    // GPS opcional
timestamp
```

**Otras entidades:** Usuario (perfil, tipo de sangre, datos médicos), Contactos de
emergencia, Impactos (historial con severidad, ubicación, telemetría para replay).

---

## 6. Pantallas clave (detalle para el rediseño)

### Dashboard (`app/(tabs)/index.tsx`) — PRINCIPAL
Elemento central: **GForceRing** (anillo SVG segmentado, ~280px, 40 segmentos, color por
severidad, `MAX_G_RING = 12`). Alrededor: saludo al rider, estado de conexión BLE, batería
del casco, velocidad estimada, tiles de métricas (aceleración/giroscopio), sparklines,
mini-mapa GPS, y flujo de **cuenta regresiva de emergencia** con notificaciones. Entradas
animadas escalonadas (stagger 60ms, FadeInDown con spring).

### Tab bar (`app/(tabs)/_layout.tsx`)
Barra con **BlurView**, icono activo dentro de un **pill con gradiente dorado** y animación
spring de escala (1.18→1), punto indicador. Se oculta al hacer scroll.

### Otras
- **devices**: escaneo BLE, lista de dispositivos, estados de conexión.
- **impacts / impact/[id] / replay/[id]**: historial, detalle y reproducción temporal de un accidente.
- **contacts / profile / settings**: gestión de contactos, datos médicos y preferencias.

---

## 7. Objetivo del rediseño ("más premium")

Quiero elevar la app manteniendo la identidad **negro + oro**. Enfoque sugerido para la IA:

1. **Jerarquía y respiración:** mejor uso de espacio, tipografía y contraste; que el
   GForceRing sea claramente el héroe.
2. **Materialidad premium:** glass más refinado, gradientes metálicos sutiles, glows
   controlados (no exagerados), micro-detalles (hairlines, inner shadows).
3. **Micro-interacciones:** transiciones fluidas, feedback háptico, estados de carga elegantes.
4. **Estados críticos:** que el modo "impacto/emergencia" se sienta urgente pero sofisticado
   (rojo controlado, no chillón).
5. **Consistencia:** todo debe derivar de tokens en `src/theme.ts` (proponer nuevos tokens si hace falta).
6. **Legibilidad en exterior/movimiento:** alto contraste, números grandes, glanceable.

**Restricciones:** React Native + Expo (ver stack §2). Entregar propuestas como cambios de
`theme.ts` + componentes RN, no como diseño web.
</content>
</invoke>
