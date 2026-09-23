import { Accelerometer, Gyroscope } from 'expo-sensors';

export interface PhoneTelemetryData {
  acceleration: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  gForce: number;
  angularVelocity: number;
  speedKmh: number;
  timestamp: number;
}

export interface DetectedImpact {
  acceleration: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  gForce: number;
  timestamp: string;
}

export interface BlackboxSample {
  timestamp: string;
  timeOffsetSeconds: number; // e.g. -9.5s a 0.0s
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  gyroscope_x: number;
  gyroscope_y: number;
  gyroscope_z: number;
  g_force: number;
  speed_kmh: number;
  latitude: number | null;
  longitude: number | null;
}

type TelemetryListener = (data: PhoneTelemetryData) => void;
type ImpactListener = (impact: DetectedImpact) => void;
type ThresholdListener = (gForce: number) => void;

class PhoneSensorEngine {
  private accelSub: { remove: () => void } | null = null;
  private gyroSub: { remove: () => void } | null = null;

  private currentAccel = { x: 0, y: 0, z: 0 };
  private currentGyro = { x: 0, y: 0, z: 0 };
  private currentGForce = 1.0;
  private peakGForce = 1.0;
  private currentLocation: { latitude: number; longitude: number; speed?: number | null } | null = null;

  // Buffer circular de 10 segundos (~100 muestras a 10 Hz)
  private readonly BLACKBOX_MAX_SAMPLES = 100;
  private blackboxBuffer: BlackboxSample[] = [];
  private lastBlackboxSampleTime = 0;

  private telemetryListeners = new Set<TelemetryListener>();
  private impactListeners = new Set<ImpactListener>();
  private thresholdListeners = new Set<ThresholdListener>();

  private isRunning = false;
  private lastEmitTime = 0;
  private lastImpactTime = 0;
  private alertThreshold = 5.0; // G

  private peakCaptureWindow = false;
  private peakWindowSamples: { accel: { x: number; y: number; z: number }; gyro: { x: number; y: number; z: number }; g: number }[] = [];

  // Muestras acumuladas en la ventana de emisión UI para suavizado y retención de pico
  private windowMaxG = 1.0;
  private emaAccel = { x: 0, y: 0, z: 0 };
  private emaGyro = { x: 0, y: 0, z: 0 };

  constructor() {
    try {
      // Acelerómetro a 16ms (~60Hz) para no perder picos de impacto
      Accelerometer.setUpdateInterval(16);
      // Giroscopio a 40ms (~25Hz) óptimo para dinámica vehicular sin saturar el puente JS
      Gyroscope.setUpdateInterval(40);
    } catch {}
  }

  public setThreshold(threshold: number) {
    // Permitir calibración desde 1.2G para detectar sacudidas humanas reales
    this.alertThreshold = Math.max(1.2, threshold);
  }

  public getThreshold(): number {
    return this.alertThreshold;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public start(threshold?: number) {
    if (this.isRunning) return;
    if (threshold) this.setThreshold(threshold);

    this.isRunning = true;
    this.lastImpactTime = 0;
    this.peakGForce = 1.0;
    this.windowMaxG = 1.0;

    try {
      // Escuchar acelerómetro a 60Hz
      this.accelSub = Accelerometer.addListener((data) => {
        this.currentAccel = {
          x: Number(data.x.toFixed(4)),
          y: Number(data.y.toFixed(4)),
          z: Number(data.z.toFixed(4)),
        };

        // Magnitud instantánea del vector G (1.0G = reposo gravitatorio)
        const magG = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        this.currentGForce = Number(magG.toFixed(2));
        if (this.currentGForce > this.peakGForce) {
          this.peakGForce = this.currentGForce;
        }
        if (this.currentGForce > this.windowMaxG) {
          this.windowMaxG = this.currentGForce;
        }

        // Suavizado EMA (factor 0.35)
        this.emaAccel = {
          x: this.emaAccel.x === 0 ? this.currentAccel.x : this.emaAccel.x * 0.65 + this.currentAccel.x * 0.35,
          y: this.emaAccel.y === 0 ? this.currentAccel.y : this.emaAccel.y * 0.65 + this.currentAccel.y * 0.35,
          z: this.emaAccel.z === 0 ? this.currentAccel.z : this.emaAccel.z * 0.65 + this.currentAccel.z * 0.35,
        };

        this.processSample();
      });

      // Escuchar giroscopio a 60Hz
      this.gyroSub = Gyroscope.addListener((data) => {
        this.currentGyro = {
          x: Number(data.x.toFixed(4)),
          y: Number(data.y.toFixed(4)),
          z: Number(data.z.toFixed(4)),
        };

        this.emaGyro = {
          x: this.emaGyro.x === 0 ? this.currentGyro.x : this.emaGyro.x * 0.65 + this.currentGyro.x * 0.35,
          y: this.emaGyro.y === 0 ? this.currentGyro.y : this.emaGyro.y * 0.65 + this.currentGyro.y * 0.35,
          z: this.emaGyro.z === 0 ? this.currentGyro.z : this.emaGyro.z * 0.65 + this.currentGyro.z * 0.35,
        };
      });
    } catch (e) {
      console.warn('Failed to start native sensors:', e);
    }
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.accelSub) {
      try { this.accelSub.remove(); } catch {}
      this.accelSub = null;
    }
    if (this.gyroSub) {
      try { this.gyroSub.remove(); } catch {}
      this.gyroSub = null;
    }
    this.peakCaptureWindow = false;
    this.peakWindowSamples = [];
  }

  private processSample() {
    const now = Date.now();

    // 1. Detección instantánea de impacto / movimiento brusco (evaluado a 60Hz)
    if (this.currentGForce >= this.alertThreshold) {
      for (const listener of this.thresholdListeners) {
        try { listener(this.currentGForce); } catch {}
      }
    }

    if (this.currentGForce >= this.alertThreshold && now - this.lastImpactTime > 15000) {
      if (!this.peakCaptureWindow) {
        this.peakCaptureWindow = true;
        this.peakWindowSamples = [];
        this.lastImpactTime = now;

        // Capturar ventana de 300ms a 60Hz (~18 muestras) para registrar el verdadero pico máximo de la sacudida o golpe
        setTimeout(() => {
          this.triggerImpactEvent();
        }, 300);
      }
    }

    if (this.peakCaptureWindow) {
      this.peakWindowSamples.push({
        accel: { ...this.currentAccel },
        gyro: { ...this.currentGyro },
        g: this.currentGForce,
      });
    }

    // 2. Buffer circular de Caja Negra a 10Hz (10 segundos = 100 muestras sincronizadas)
    if (now - this.lastBlackboxSampleTime >= 100) {
      this.lastBlackboxSampleTime = now;
      const dynG = Math.max(0, this.currentGForce - 1.0);
      const speed = this.currentLocation?.speed !== undefined && this.currentLocation.speed !== null && this.currentLocation.speed > 0
        ? Math.round(this.currentLocation.speed * 3.6)
        : Math.round(dynG * 18.5);

      this.blackboxBuffer.push({
        timestamp: new Date(now).toISOString(),
        timeOffsetSeconds: 0,
        acceleration_x: this.currentAccel.x,
        acceleration_y: this.currentAccel.y,
        acceleration_z: this.currentAccel.z,
        gyroscope_x: this.currentGyro.x,
        gyroscope_y: this.currentGyro.y,
        gyroscope_z: this.currentGyro.z,
        g_force: this.currentGForce,
        speed_kmh: speed,
        latitude: this.currentLocation?.latitude ?? null,
        longitude: this.currentLocation?.longitude ?? null,
      });

      if (this.blackboxBuffer.length > this.BLACKBOX_MAX_SAMPLES) {
        this.blackboxBuffer.shift();
      }
    }

    // 3. Emitir telemetría para la UI con cadencia serena (~220ms / 4.5 fps)
    // Esto evita re-renderizar la pantalla 12-20 veces por segundo ("muchos datos por segundo")
    // mientras el tacómetro interpola a 60 fps con resortes Reanimated
    if (now - this.lastEmitTime >= 220) {
      this.lastEmitTime = now;
      const rotMag = Math.sqrt(
        this.emaGyro.x * this.emaGyro.x +
        this.emaGyro.y * this.emaGyro.y +
        this.emaGyro.z * this.emaGyro.z
      );

      // Usar el pico de la ventana si hubo sacudida, o el valor suavizado si está estable
      const displayG = Number(this.windowMaxG.toFixed(2));
      this.windowMaxG = this.currentGForce; // Reiniciar ventana

      const dynamicG = Math.max(0, displayG - 1.0);
      const estimatedSpeed = this.currentLocation?.speed !== undefined && this.currentLocation.speed !== null && this.currentLocation.speed > 0
        ? Math.round(this.currentLocation.speed * 3.6)
        : Math.round(dynamicG * 18.5);

      const snapshot: PhoneTelemetryData = {
        acceleration: {
          x: Number(this.emaAccel.x.toFixed(3)),
          y: Number(this.emaAccel.y.toFixed(3)),
          z: Number(this.emaAccel.z.toFixed(3)),
        },
        gyroscope: {
          x: Number(this.emaGyro.x.toFixed(3)),
          y: Number(this.emaGyro.y.toFixed(3)),
          z: Number(this.emaGyro.z.toFixed(3)),
        },
        gForce: displayG,
        angularVelocity: Number(rotMag.toFixed(2)),
        speedKmh: estimatedSpeed,
        timestamp: now,
      };

      for (const listener of this.telemetryListeners) {
        try {
          listener(snapshot);
        } catch (e) {
          console.warn('Error in telemetry listener', e);
        }
      }
    }
  }

  private triggerImpactEvent() {
    this.peakCaptureWindow = false;
    if (this.peakWindowSamples.length === 0) return;

    // Encontrar la muestra con el pico G más alto
    let maxSample = this.peakWindowSamples[0];
    for (const sample of this.peakWindowSamples) {
      if (sample.g > maxSample.g) {
        maxSample = sample;
      }
    }

    const detected: DetectedImpact = {
      acceleration: maxSample.accel,
      gyroscope: maxSample.gyro,
      gForce: maxSample.g,
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.impactListeners) {
      try {
        listener(detected);
      } catch (e) {
        console.warn('Error in impact listener', e);
      }
    }
    this.peakWindowSamples = [];
  }

  public onTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  public onImpact(listener: ImpactListener): () => void {
    this.impactListeners.add(listener);
    return () => {
      this.impactListeners.delete(listener);
    };
  }

  public onThresholdExceeded(listener: ThresholdListener): () => void {
    this.thresholdListeners.add(listener);
    return () => {
      this.thresholdListeners.delete(listener);
    };
  }

  public updateCurrentLocation(loc: { latitude: number; longitude: number; speed?: number | null }) {
    this.currentLocation = loc;
  }

  public getPreImpactBlackbox(): BlackboxSample[] {
    if (this.blackboxBuffer.length === 0) return [];
    const lastTs = new Date(this.blackboxBuffer[this.blackboxBuffer.length - 1].timestamp).getTime();
    return this.blackboxBuffer.map((s) => ({
      ...s,
      timeOffsetSeconds: Number(((new Date(s.timestamp).getTime() - lastTs) / 1000).toFixed(2)),
    }));
  }

  public getCurrentSnapshot(): PhoneTelemetryData {
    return {
      acceleration: { ...this.currentAccel },
      gyroscope: { ...this.currentGyro },
      gForce: this.currentGForce,
      angularVelocity: Math.sqrt(
        this.currentGyro.x * this.currentGyro.x +
        this.currentGyro.y * this.currentGyro.y +
        this.currentGyro.z * this.currentGyro.z
      ),
      speedKmh: Math.max(0, Math.round((this.currentGForce - 1.0) * 18.5)),
      timestamp: Date.now(),
    };
  }
}

export const phoneSensorEngine = new PhoneSensorEngine();
