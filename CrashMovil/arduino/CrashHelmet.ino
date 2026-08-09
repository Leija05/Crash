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
const unsigned long SEND_INTERVAL_MS = 50; // ~20 Hz
unsigned long lastBlinkMs    = 0;
bool ledState = false;

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
  // Formato: CRASH:ax,ay,az,gx,gy,gz,gForce[,battery]
  // El prefijo "CRASH:" permite que la app identifique el dispositivo.
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
