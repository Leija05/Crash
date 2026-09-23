import { useState, memo } from "react";
import { motion } from "framer-motion";
import {
  Cpu, Zap, Radio, Battery, Activity, Volume2,
  Lightbulb, ShieldAlert, CheckCircle2,
  Layers, Terminal, ArrowRight, Gauge, Sparkles
} from "lucide-react";
import { useI18n } from "../i18n";

const COMPONENTS_DATA = [
  {
    id: "esp32",
    name: "ESP32 Dual-Core (BLE Integrado)",
    role: "Cerebro Central / SoC con BLE Nativo",
    chip: "Espressif ESP32-WROOM-32 @ 240 MHz",
    pins: "GPIO 21 (I2C SDA), GPIO 22 (I2C SCL), GPIO 18 (Buzzer), GPIO 2 (LED), GPIO 34 (Sensor Batería ADC), 3.3V / GND / VIN",
    voltage: "3.3V lógica (Alimentación VIN 5V / LiPo 3.7V)",
    specs: [
      "Microprocesador Xtensa Dual-Core 32 bits a 240 MHz de alto rendimiento",
      "Transceptor Bluetooth Low Energy (BLE 4.2 / 5.0) integrado directamente en el silicio",
      "Bucle de telemetría inercial optimizado a 10 Hz (100 ms) sin módulos externos",
      "Conversor ADC de 12 bits (0 - 4095) en GPIO 34 para monitoreo de batería de precisión",
    ],
    desc: "Microcontrolador de 32 bits que coordina el nodo sensor del casco. Integra de forma nativa la radio Bluetooth Low Energy en el propio chip (eliminando cables y módulos seriales externos), procesa la cinemática del MPU-6050 en tiempo real y ejecuta los algoritmos anti-falsos positivos.",
    tag: "CONTROL · BLE SoC",
    accent: "#ef4444",
  },
  {
    id: "mpu6050",
    name: "Sensor Inercial MPU-6050",
    role: "IMU MEMS de 6 Grados de Libertad",
    chip: "InvenSense MPU-6050 (Acelerómetro + Giroscopio)",
    pins: "VCC (3.3V), GND, SDA (GPIO 21), SCL (GPIO 22)",
    voltage: "3.3V I2C",
    specs: [
      "Acelerómetro triaxial configurado en rango ±16G (2048 LSB/g)",
      "Giroscopio triaxial en rango ±250°/s (131.0 LSB/°/s)",
      "Bus I2C dedicado en GPIO 21 (SDA) y GPIO 22 (SCL) del ESP32",
      "Cálculo continuo de magnitud resultante: √(x² + y² + z²)",
    ],
    desc: "Censa la cinemática de la cabeza del conductor en los ejes X, Y y Z. Su escala de ±16G garantiza capturar colisiones vehiculares de alta energía sin saturar la señal analógica del sensor.",
    tag: "SENSOR · I2C",
    accent: "#f59e0b",
  },
  {
    id: "ble_native",
    name: "Bluetooth Low Energy Integrado (BLE)",
    role: "Transceptor Inalámbrico Nativo en SoC",
    chip: "ESP32 Radio RF 2.4 GHz (BLE 4.2 / 5.0)",
    pins: "Antena PCB integrada en el módulo ESP32 (sin cableado externo)",
    voltage: "Ultra bajo consumo (< 15 mA en TX activo)",
    specs: [
      "Transmisión inalámbrica directa hacia la app móvil con trama 'CRASH:...\\n' a 10 Hz",
      "Alcance: Hasta 20 metros con excelente penetración a través de la calota del casco",
      "Servicio GATT personalizado para telemetría continua y paquetes de impacto",
      "Protocolo de auto-reconexión escalonada instantánea con la aplicación C.R.A.S.H.",
    ],
    desc: "Al estar integrado en el propio procesador ESP32, la radio Bluetooth Low Energy opera de forma nativa con latencia inferior a 15 ms, reduciendo peso, volumen y puntos de falla por vibración en el casco.",
    tag: "TELECOM · BLE NATIVO",
    accent: "#3b82f6",
  },
  {
    id: "battery_divider",
    name: "Divisor de Voltaje de Batería",
    role: "Monitor Analógico de Estado de Carga",
    chip: "R1 (10 kΩ 1%) + R2 (10 kΩ 1%)",
    pins: "Vbat → R1 → GPIO 34 (ADC) → R2 → GND",
    voltage: "Entrada: 3.3V - 4.2V → Salida en GPIO 34: ~1.65V - 2.10V",
    specs: [
      "Voltaje máximo seguro: 2.1V en GPIO 34 (seguro para el rango ADC 3.3V del ESP32)",
      "Fórmula de escala: Vbat = Vpin × ((R1 + R2) / R2) = Vpin × 2",
      "Rango calibrado: 3.3V (0% descargada) a 4.2V (100% carga plena)",
      "Filtro digital exponencial: pct = pct_prev × 0.9 + lectura × 0.1",
    ],
    desc: "Permite al ESP32 conocer con precisión milimétrica el porcentaje de batería restante del casco y transmitirlo como 8º parámetro en la trama para alertar al motociclista antes de salir a ruta.",
    tag: "ENERGÍA · ADC",
    accent: "#10b981",
  },
  {
    id: "buzzer",
    name: "Buzzer Piezoeléctrico Activo",
    role: "Alarma Sonora Acústica de Emergencia",
    chip: "Buzzer Activo 85 dB",
    pins: "Ánodo (+) → GPIO 18 · Cátodo (-) → GND",
    voltage: "3.3V - 5V Digital",
    specs: [
      "Potencia acústica: 85 dB a 10 cm",
      "Activación continua automática si magnitud G ≥ 10.0 G",
      "Alerta inmediata a testigos, transeúntes y rescatistas en el lugar del accidente",
      "Apagado automático cuando el sistema retorna a nivel seguro o es cancelado",
    ],
    desc: "Proporciona feedback acústico de auxilio instantáneo cuando el conductor sufre una colisión crítica o pérdida de consciencia, guiando a los servicios de rescate hacia la víctima en zonas oscuras o con matorrales.",
    tag: "ACTUADOR · ALARMA",
    accent: "#ec4899",
  },
  {
    id: "led",
    name: "LED de Estado y Diagnóstico",
    role: "Indicador Óptico Visual de Alta Visibilidad",
    chip: "LED Ultrabrillante + R 220Ω",
    pins: "Ánodo (+) → GPIO 2 · Cátodo (-) → GND",
    voltage: "3.3V Digital con R limitadora",
    specs: [
      "Secuencia de inicio: 3 destellos rápidos de confirmación de salud (blinkStartup)",
      "Parpadeo rápido (150 ms) con impactos moderados (≥ 5.0 G)",
      "Luz fija permanente en choque severo (≥ 10.0 G)",
      "Visibilidad nocturna para inspección rápida de operatividad",
    ],
    desc: "Permite comprobar con una mirada si el casco está encendido, calibrado y enlazado correctamente por BLE, o si se encuentra en modo de alerta activa.",
    tag: "DIAGNÓSTICO · ÓPTICO",
    accent: "#f43f5e",
  },
  {
    id: "tp4056",
    name: "Módulo de Carga TP4056 + LiPo",
    role: "Alimentación Autónoma y Gestión de Carga",
    chip: "TP4056 + DW01A + 8205A BMS",
    pins: "IN+ / IN- (USB-C 5V), BAT+ / BAT- (Batería LiPo 3.7V), OUT+ / OUT- (VIN / GND ESP32)",
    voltage: "Entrada 5V USB → Carga 4.2V CC/CV a 1A",
    specs: [
      "Capacidad típica: 1000 - 1200 mAh (hasta 18 horas de autonomía continua)",
      "Protección contra sobrecarga (corte a 4.25V)",
      "Protección contra sobredescarga (corte a 2.5V para preservar la celda)",
      "Protección contra cortocircuito y sobrecorriente hasta 3A",
    ],
    desc: "Alimenta todo el circuito del casco sin cables externos hacia la motocicleta. Se recarga con cualquier cargador estándar de celular mediante conector USB.",
    tag: "BMS · PROTECCIÓN",
    accent: "#8b5cf6",
  },
];

const WIRING_MAP = [
  { from: "MPU-6050 VCC", to: "ESP32 3.3V", color: "text-red-400 bg-red-500/10 border-red-500/30", type: "Alimentación 3.3V" },
  { from: "MPU-6050 GND", to: "ESP32 GND", color: "text-zinc-300 bg-zinc-800/80 border-zinc-700", type: "Tierra común" },
  { from: "MPU-6050 SDA", to: "ESP32 GPIO 21", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", type: "I2C Datos (SDA)" },
  { from: "MPU-6050 SCL", to: "ESP32 GPIO 22", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", type: "I2C Reloj (SCL)" },
  { from: "Transceptor BLE", to: "Antena PCB SoC ESP32", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", type: "BLE Integrado en Chip" },
  { from: "Buzzer (+)", to: "ESP32 GPIO 18", color: "text-pink-400 bg-pink-500/10 border-pink-500/30", type: "Alarma Acústica" },
  { from: "LED (+)", to: "ESP32 GPIO 2 (R 220Ω)", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", type: "Indicador Óptico" },
  { from: "Vbat LiPo", to: "R1 (10k) → GPIO 34 → R2 (10k)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", type: "Sensor Batería ADC" },
  { from: "TP4056 OUT+", to: "ESP32 VIN", color: "text-purple-400 bg-purple-500/10 border-purple-500/30", type: "Alimentación Sistema" },
  { from: "TP4056 OUT-", to: "ESP32 GND", color: "text-zinc-300 bg-zinc-800/80 border-zinc-700", type: "Tierra Alimentación" },
];

function CircuitExplorer() {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState("esp32");

  const currentComp = COMPONENTS_DATA.find((c) => c.id === selectedId) || COMPONENTS_DATA[0];

  return (
    <div className="w-full">
      {/* ── Header Badge ── */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/15 glass-refined shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-[0.2em] text-red-400 font-bold">
              {t("circuit.headerTitle", "Nodo Sensor IoT · Casco Inteligente")}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white">
              ESP32 SoC (BLE Integrado) + Sensor MEMS MPU-6050 (±16G)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-bold flex items-center gap-1.5">
            <Radio size={13} className="animate-pulse" /> BLE 10 HZ NATIVO
          </span>
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
            <Battery size={13} /> LiPo 3.7V + BMS
          </span>
        </div>
      </div>

      {/* ── Circuit Component Explorer ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        {/* Component Tabs Grid / Mobile Horizontal Scroll */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:gap-2.5 snap-x">
          {COMPONENTS_DATA.map((c) => {
            const active = selectedId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`min-w-[145px] sm:min-w-0 snap-start p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
                  active
                    ? "bg-red-500/20 border-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,0.35)] scale-[1.02]"
                    : "bg-zinc-900/80 border-white/15 text-zinc-300 hover:border-white/30 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    {c.tag.split(" · ")[1] || c.tag}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: active ? c.accent : "rgba(255,255,255,0.3)" }}
                  />
                </div>
                <div className="font-mono text-xs font-bold leading-tight text-white mt-2">
                  {c.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Component Deep Dive */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Component Specs Card */}
          <div className="lg:col-span-7 hud-frame glass-refined rounded-3xl p-6 sm:p-8 border border-white/15 bg-black/60 relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[90px] pointer-events-none opacity-20"
              style={{ backgroundColor: currentComp.accent }}
            />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="tactical-index">{currentComp.tag}</span>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                {currentComp.voltage}
              </span>
            </div>

            <h3 className="font-bold font-mono text-2xl sm:text-3xl text-white tracking-tight">
              {currentComp.name}
            </h3>
            <div className="text-red-400 font-mono text-xs uppercase tracking-wider mt-1 mb-4 font-semibold">
              {currentComp.role}
            </div>

            <p className="text-zinc-200 text-sm leading-relaxed mb-6">
              {currentComp.desc}
            </p>

            <div className="space-y-2.5 mb-6">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                ESPECIFICACIONES TÉCNICAS
              </div>
              {currentComp.specs.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-200 font-mono bg-white/[0.04] p-3 rounded-xl border border-white/10">
                  <CheckCircle2 size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-white/15 bg-white/[0.05]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1 font-semibold">
                CONEXIONES Y PINES ASIGNADOS
              </div>
              <div className="font-mono text-xs text-white font-bold">
                {currentComp.pins}
              </div>
            </div>
          </div>

          {/* Right: Wiring Map & Telemetry Frame Decoder */}
          <div className="lg:col-span-5 space-y-6">
            {/* Wiring Map Card */}
            <div className="hud-frame glass-refined rounded-3xl p-6 border border-white/15 bg-black/60">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" />
                  MAPA DE CABLEADO DEL CIRCUITO
                </div>
                <span className="text-[10px] font-mono text-zinc-300 font-bold">10 CONEXIONES</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {WIRING_MAP.map((w, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono"
                  >
                    <div className="text-zinc-200">
                      <strong className="text-white font-bold">{w.from}</strong>
                      <span className="text-zinc-400 mx-1.5">→</span>
                      <span className="text-zinc-300">{w.to}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold w-fit ${w.color}`}>
                      {w.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Serial Telemetry Decoder */}
            <div className="hud-frame glass-refined rounded-3xl p-6 border border-white/15 bg-black/60">
              <div className="font-mono font-bold text-sm text-white flex items-center gap-2 mb-3">
                <Terminal size={16} className="text-emerald-400" />
                PAQUETE BLE DE TELEMETRÍA (10 HZ)
              </div>

              <div className="p-3 rounded-xl bg-black/80 border border-white/15 font-mono text-xs text-emerald-400 overflow-x-auto select-all mb-3 font-bold no-scrollbar">
                <code>CRASH:0.1245,-0.0412,0.9850,0.012,-0.005,0.002,1.0142,98.5\n</code>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-white/[0.04] p-2 rounded-lg border border-white/10">
                  <span className="text-zinc-400">ax, ay, az:</span> <span className="text-white font-semibold">Acel. triaxial en G</span>
                </div>
                <div className="bg-white/[0.04] p-2 rounded-lg border border-white/10">
                  <span className="text-zinc-400">gx, gy, gz:</span> <span className="text-white font-semibold">Giroscopio en °/s</span>
                </div>
                <div className="bg-white/[0.04] p-2 rounded-lg border border-white/10">
                  <span className="text-zinc-400">gForce:</span> <span className="text-amber-400 font-semibold">Magnitud resultante</span>
                </div>
                <div className="bg-white/[0.04] p-2 rounded-lg border border-white/10">
                  <span className="text-zinc-400">battery:</span> <span className="text-emerald-400 font-semibold">LiPo (0-100%)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-mono text-zinc-300">
                <span>Anti-falsos positivos: <strong className="text-white">3 muestras ≥ 4.0G</strong></span>
                <span className="text-red-400 font-bold">Choque: ≥ 10.0G</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(CircuitExplorer);
