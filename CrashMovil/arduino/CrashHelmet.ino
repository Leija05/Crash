#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;

// ─── Pines de retroalimentación ───
const int LED_PIN = 13;
const int BUZZER_PIN = 8;

// ─── Umbrales ───
const float IMPACT_THRESHOLD_G = 5.0;
const float CRASH_THRESHOLD_G  = 10.0;

// ─── Anti-falsos positivos ───
const int   IMPACT_CONFIRM_SAMPLES = 3;
const float IMPACT_MIN_SUSTAINED   = 4.0;
int impactSampleCount = 0;

// ─── Timing ───
unsigned long lastSendMs     = 0;
// 100ms = 10 Hz: suficiente para la gráfica fluida y evita saturar el
// canal BLE (a 20 Hz el módulo HM-10 no da abasto y la app se crasheaba).
const unsigned long SEND_INTERVAL_MS = 100;
unsigned long lastBlinkMs    = 0;
bool ledState = false;

// ─── Medición de batería ───
// Cableado del divisor de voltaje:
//   Vbat --[R1]-- A0 --[R2]-- GND
// Con R1 = R2 = 10k, una LiPo a 4.2V entrega ~2.1V en A0 (seguro con ref. 5V).
// Ajusta R1/R2 y los voltajes según tu batería.
const int BATTERY_PIN = A0;
const float BATTERY_R1 = 10000.0;  // ohms
const float BATTERY_R2 = 10000.0;  // ohms
const float BATTERY_FULL_V  = 4.2; // LiPo cargada al 100%
const float BATTERY_EMPTY_V = 3.3; // LiPo prácticamente descargada (0%)
const unsigned long BATTERY_READ_INTERVAL_MS = 1000; // 1 lectura por segundo
float batteryPercent = 100.0;
unsigned long lastBatteryMs = 0;

// ─── Identificador del dispositivo ───
// La app usa este prefijo para identificar cascos C.R.A.S.H. durante el escaneo.
const char* DEVICE_ID = "CRASH";

void setup() {
  Serial.begin(9600);
  Wire.begin();
  mpu.initialize();

  // Sensibilidad alta: 16G para impactos reales.
  // Factor de escala: 2048 LSB/g
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_16);

  // Feedback visual al iniciar
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  blinkStartup();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendMs < SEND_INTERVAL_MS) {
    // Intermedio: mantener parpadeo si hay impacto
    if (impactSampleCount > 0) {
      blinkImpact(now);
    }
    return;
  }
  lastSendMs = now;

  // Lectura de batería 1 vez por segundo con suavizado (promedio exponencial)
  if (now - lastBatteryMs >= BATTERY_READ_INTERVAL_MS) {
    lastBatteryMs = now;
    int raw = analogRead(BATTERY_PIN);
    float vPin = raw * (5.0 / 1023.0);
    float vBat = vPin * ((BATTERY_R1 + BATTERY_R2) / BATTERY_R2);
    float pct = constrain((vBat - BATTERY_EMPTY_V) / (BATTERY_FULL_V - BATTERY_EMPTY_V) * 100.0, 0.0, 100.0);
    batteryPercent = batteryPercent * 0.9 + pct * 0.1;
  }

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Conversión a G's
  float xG = ax / 2048.0;
  float yG = ay / 2048.0;
  float zG = az / 2048.0;

  // Magnitud vectorial total
  float magnitudG = sqrt(xG * xG + yG * yG + zG * zG);

  // Conversión de giroscopio a °/s (rango ±250°/s, factor 131.0)
  float gxR = gx / 131.0;
  float gyR = gy / 131.0;
  float gzR = gz / 131.0;

  // ─── Detección de impacto con confirmación ───
  bool isCritical = false;
  if (magnitudG >= IMPACT_MIN_SUSTAINED) {
    impactSampleCount++;
    if (impactSampleCount >= IMPACT_CONFIRM_SAMPLES) {
      isCritical = true;
    }
  } else {
    impactSampleCount = max(0, impactSampleCount - 1);
  }

  // ─── LED/Buzzer feedback ───
  if (magnitudG >= CRASH_THRESHOLD_G) {
    // Impacto severo: buzzer continuo
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_PIN, HIGH);
  } else if (magnitudG >= IMPACT_THRESHOLD_G) {
    // Impacto moderado: parpadeo rápido
    blinkImpact(now);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    impactSampleCount = 0;
  }

  // ─── ENVÍO DE TELEMETRÍA ───
  // Formato: CRASH:ax,ay,az,gx,gy,gz,gForce,battery
  // El prefijo "CRASH:" permite que la app identifique el dispositivo.
  // La batería va en % (0-100) como 8º campo; la app la muestra en el dashboard.
  // El delimitador '\n' al final permite separar paquetes.
  Serial.print(DEVICE_ID);
  Serial.print(':');
  Serial.print(xG, 4);
  Serial.print(',');
  Serial.print(yG, 4);
  Serial.print(',');
  Serial.print(zG, 4);
  Serial.print(',');
  Serial.print(gxR, 4);
  Serial.print(',');
  Serial.print(gyR, 4);
  Serial.print(',');
  Serial.print(gzR, 4);
  Serial.print(',');
  Serial.print(magnitudG, 4);
  Serial.print(',');
  Serial.print(batteryPercent, 1);
  Serial.println();
}

// ─── Funciones de retroalimentación ───

void blinkStartup() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

void blinkImpact(unsigned long now) {
  if (now - lastBlinkMs >= 150) {
    lastBlinkMs = now;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  }
}
