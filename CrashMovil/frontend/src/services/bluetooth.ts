import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Subscription, State, LogLevel } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

if (!global.Buffer) {
  global.Buffer = Buffer;
}

export type BluetoothStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';

export interface TelemetryData {
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  gyroscope_x: number;
  gyroscope_y: number;
  gyroscope_z: number;
  g_force: number;
  battery?: number | null;
  critical: boolean;
  timestamp: number;
  latitude?: number | null;
  longitude?: number | null;
  speed_kmh?: number | null;
}

export interface ScanDevice {
  id: string;
  address: string;
  name: string;
  isCompatible: boolean;
  moduleType: string;
  connected: boolean;
  rssi?: number;
  isCrashDevice?: boolean;
}

// UUIDs estándar para módulos BLE tipo HM-10 / MLT-BT05 / CRASH
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
const FALLBACK_SERVICE_UUIDS = [
  SERVICE_UUID,
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000dfb0-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
  '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
];
const FALLBACK_CHARACTERISTIC_UUIDS = [
  CHARACTERISTIC_UUID,
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000ffe2-0000-1000-8000-00805f9b34fb',
];
const CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';

class BluetoothTelemetryService {
  private bleManager = new BleManager();
  private telemetryListeners = new Set<(data: TelemetryData) => void>();
  private statusListeners = new Set<(status: BluetoothStatus, detail?: string) => void>();
  private deviceListeners = new Set<(device: any | null) => void>();

  private connectedDevice: Device | null = null;
  private monitorSubscription: Subscription | null = null;
  private readBuffer = '';
  private connected = false;
  private batteryLevel: number | null = null;

  // Throttle de emisión: el circuito envía muchos paquetes por segundo.
  // Guardamos la última lectura válida y la emitimos a cadencia fija (~10 Hz)
  // para no saturar el hilo de JS de React (lo que crasheaba la app).
  private latestTelemetry: TelemetryData | null = null;
  private lastEmitAt = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly EMIT_INTERVAL_MS = 100; // ~10 Hz
  private readonly EMIT_MIN_GAP_CRITICAL_MS = 50;

  // Monitoreo de salud de conexión
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastDataReceivedAt = 0;
  private readonly HEALTH_CHECK_INTERVAL_MS = 3000;
  private readonly DATA_TIMEOUT_MS = 8000;
  private connectionRetryCount = 0;
  private readonly MAX_MONITOR_RETRIES = 3;

  constructor() {
    this.bleManager.setLogLevel(LogLevel.None);
  }

  // --- Helpers de Estado ---
  isNativeAvailable() { return Platform.OS !== 'web'; }
  isConnected() { return this.connected; }
  getConnectedDevice() { return this.connectedDevice; }
  getBatteryLevel() { return this.batteryLevel; }
  getLastDataReceivedAt() { return this.lastDataReceivedAt; }

  // --- Gestión de Listeners ---
  onDeviceChange(l: (d: any | null) => void) {
    this.deviceListeners.add(l);
    return () => this.deviceListeners.delete(l);
  }
  onTelemetry(l: (d: TelemetryData) => void) {
    this.telemetryListeners.add(l);
    return () => this.telemetryListeners.delete(l);
  }
  onStatus(l: (s: BluetoothStatus, d?: string) => void) {
    this.statusListeners.add(l);
    return () => this.statusListeners.delete(l);
  }

  private emitDevice(d: any | null) { this.deviceListeners.forEach(l => l(d)); }
  private emitStatus(s: BluetoothStatus, d?: string) { this.statusListeners.forEach(l => l(s, d)); }
  private emitTelemetry(d: TelemetryData) { this.telemetryListeners.forEach(l => l(d)); }

  // --- Permisos y Escaneo ---
  async isBluetoothEnabled() {
    const state = await this.bleManager.state();
    return state === State.PoweredOn;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const api = parseInt(Platform.Version.toString(), 10);
      const perms: string[] = api >= 31
        ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]
        : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      if (api >= 33) {
        perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      const granted = await PermissionsAndroid.requestMultiple(perms as never);
      return Object.values(granted).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
    } catch { return false; }
  }

  async startDeviceScan(onDeviceFound: (device: Device) => void) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) { this.emitStatus('error', 'Permisos denegados'); return; }

    this.emitStatus('scanning', 'Buscando casco...');
    this.bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        this.emitStatus('error', `Error en escaneo: ${error.message || 'desconocido'}`);
        this.bleManager.stopDeviceScan();
        return;
      }
      if (device && (device.name || device.localName)) onDeviceFound(device);
    });

    setTimeout(() => {
      this.bleManager.stopDeviceScan();
      if (!this.connected) this.emitStatus('idle');
    }, 10000);
  }

  // --- Conexión y Monitoreo ---
  async connectToDevice(id: string): Promise<boolean> {
    try {
      this.bleManager.stopDeviceScan();
      this.emitStatus('connecting', 'Estableciendo enlace...');

      const device = await this.bleManager.connectToDevice(id, { timeout: 8000 });

      // Pausa breve para permitir que el módulo complete el handshake
      await this.sleep(300);

      this.emitStatus('connecting', 'Descubriendo servicios...');
      await device.discoverAllServicesAndCharacteristics();

      // Pausa adicional para que las notificaciones estén listas
      await this.sleep(500);

      this.connectedDevice = device;
      this.connected = true;
      this.emitDevice(device);
      this.emitStatus('connected', device.name || 'C.R.A.S.H. Module');

      // Limpiar buffer al conectar para evitar basura previa
      this.readBuffer = '';
      this.batteryLevel = null;
      this.connectionRetryCount = 0;

      // Intentar configurar el monitor de telemetría con reintentos
      const monitored = await this.setupTelemetryMonitorWithRetry(device);
      if (!monitored) {
        await this.disconnect();
        this.emitStatus('error', 'No se encontró canal de telemetría. Verifica que el módulo esté emitiendo datos.');
        return false;
      }

      this.ensureFlushLoop();
      this.startHealthCheck();
      return true;
    } catch (e) {
      console.error('Error de conexión:', e);
      const msg = String((e as any)?.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('busy') || msg.includes('in use')) {
        this.emitStatus('error', 'El circuito está vinculado a otro teléfono. Desvincúlalo y reintenta.');
      } else if (msg.includes('timeout') || msg.includes('timed out')) {
        this.emitStatus('error', 'Tiempo de espera agotado. El módulo puede estar fuera de alcance.');
      } else if (msg.includes('ble')) {
        this.emitStatus('error', `Error BLE: ${(e as any)?.message || 'desconocido'}`);
      } else {
        this.emitStatus('error', 'Fallo de conexión');
      }
      return false;
    }
  }

  private normalizeUuid(uuid: string) {
    return uuid.toLowerCase();
  }

  // --- Configuración de Monitor con Reintentos ---
  private async setupTelemetryMonitorWithRetry(device: Device): Promise<boolean> {
    for (let attempt = 1; attempt <= this.MAX_MONITOR_RETRIES; attempt++) {
      const success = await this.setupTelemetryMonitor(device);
      if (success) return true;

      if (attempt < this.MAX_MONITOR_RETRIES) {
        console.log(`Intento ${attempt} de ${this.MAX_MONITOR_RETRIES} falló. Reintentando en ${attempt * 500}ms...`);
        await this.sleep(attempt * 500);
        // Re-descubrir servicios en caso de que el primer intento fallara
        try {
          await device.discoverAllServicesAndCharacteristics();
        } catch { /* ignorar */ }
      }
    }
    return false;
  }

  private async setupTelemetryMonitor(device: Device): Promise<boolean> {
    try {
      const services = await device.services();
      if (!services || services.length === 0) {
        console.warn('No se encontraron servicios BLE');
        return false;
      }

      const knownService = services.find((service) =>
        FALLBACK_SERVICE_UUIDS.includes(this.normalizeUuid(service.uuid))
      );

      const candidateServices = knownService ? [knownService] : services;

      for (const service of candidateServices) {
        try {
          const chars = await service.characteristics();
          if (!chars || chars.length === 0) continue;

          const knownChar = chars.find((char) =>
            FALLBACK_CHARACTERISTIC_UUIDS.includes(this.normalizeUuid(char.uuid))
          );

          const telemetryChar = knownChar || chars.find((char) => char.isNotifiable || char.isIndicatable || char.isReadable);
          if (!telemetryChar) continue;

          // Intentar escribir en el CCCD para habilitar notificaciones
          // (algunos módulos HM-10 clones lo necesitan explícitamente)
          if (telemetryChar.isNotifiable || telemetryChar.isIndicatable) {
            try {
              const cccd = telemetryChar.descriptors?.find(
                (d) => this.normalizeUuid(d.uuid) === CCCD_UUID
              );
              if (cccd) {
                await device.writeDescriptorForCharacteristic(telemetryChar, cccd.uuid, [0x01, 0x00]);
                await this.sleep(100);
              }
            } catch {
              // Algunos módulos manejan el CCCD automáticamente; ignorar error
            }
          }

          this.emitStatus('connected', `Canal BLE: ${service.uuid.slice(4, 8).toUpperCase()}/${telemetryChar.uuid.slice(4, 8).toUpperCase()}`);

          // Configurar el monitor
          this.monitorSubscription = device.monitorCharacteristicForService(
            service.uuid,
            telemetryChar.uuid,
            (error, char) => {
              if (error) {
                console.warn('Error en monitoreo BLE:', error.message);
                // No desconectar inmediatamente; el health check se encargará
                return;
              }
              if (char?.value) {
                const raw = Buffer.from(char.value, 'base64').toString('utf-8');
                this.lastDataReceivedAt = Date.now();
                this.processBleData(raw);
              }
            }
          );
          return true;
        } catch (charErr) {
          console.warn(`Error explorando servicio ${service.uuid}:`, charErr);
          continue;
        }
      }
    } catch (svcErr) {
      console.warn('Error descubriendo servicios:', svcErr);
    }
    return false;
  }

  // --- Monitoreo de Salud de Conexión ---
  private startHealthCheck() {
    this.stopHealthCheck();
    this.lastDataReceivedAt = Date.now();
    this.healthCheckTimer = setInterval(() => {
      if (!this.connected || !this.connectedDevice) {
        this.stopHealthCheck();
        return;
      }
      const elapsed = Date.now() - this.lastDataReceivedAt;
      if (elapsed > this.DATA_TIMEOUT_MS && this.connected) {
        console.warn(`Sin datos BLE por ${Math.round(elapsed / 1000)}s. Verificando conexión...`);
        this.checkDeviceConnection();
      }
    }, this.HEALTH_CHECK_INTERVAL_MS);
  }

  private stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private async checkDeviceConnection() {
    if (!this.connectedDevice) return;
    try {
      const isConn = await this.connectedDevice.isConnected();
      if (!isConn) {
        console.warn('Dispositivo BLE desconectado detectado por health check');
        this.handleUnexpectedDisconnect();
      }
    } catch {
      console.warn('No se pudo verificar conexión del dispositivo');
      this.handleUnexpectedDisconnect();
    }
  }

  private handleUnexpectedDisconnect() {
    this.connected = false;
    this.connectedDevice = null;
    this.readBuffer = '';
    this.latestTelemetry = null;
    this.stopFlushLoop();
    this.stopHealthCheck();
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }
    this.emitDevice(null);
    this.emitStatus('error', 'Conexión BLE perdida. Reconectando...');
  }

  // --- Procesamiento de Datos (Optimizado para fragmentación) ---
  private processBleData(data: string) {
    this.readBuffer += data;

    // Protección: si el stream no trae delimitadores, el buffer crecería sin
    // límite. Recortamos manteniendo lo posterior al último '\n'.
    if (this.readBuffer.length > 4096) {
      const lastNl = this.readBuffer.lastIndexOf('\n');
      this.readBuffer = lastNl >= 0 ? this.readBuffer.slice(lastNl + 1) : '';
    }

    // Buscamos el delimitador que definiste en Arduino: Serial.println() -> \n
    let breakIndex = this.readBuffer.indexOf('\n');

    while (breakIndex !== -1) {
      const line = this.readBuffer.slice(0, breakIndex).trim();
      this.readBuffer = this.readBuffer.slice(breakIndex + 1);

      if (line.length > 0) {
        const parsed = this.parseLine(line);
        if (parsed) {
          // Guardamos la lectura más reciente; el loop de flush la emite a
          // cadencia fija para no saturar React ni crashear la app.
          this.latestTelemetry = parsed;
          // Los eventos críticos se propagan casi de inmediato (con un gap
          // mínimo para evitar ráfagas), sin esperar al tick.
          if (parsed.critical && Date.now() - this.lastEmitAt >= this.EMIT_MIN_GAP_CRITICAL_MS) {
            this.flushTelemetry();
          }
        }
      }
      breakIndex = this.readBuffer.indexOf('\n');
    }

    this.ensureFlushLoop();
  }

  // Emite la última telemetría válida a los listeners a máx ~10 Hz.
  private flushTelemetry() {
    const latest = this.latestTelemetry;
    if (!latest) return;
    this.latestTelemetry = null;
    this.lastEmitAt = Date.now();
    this.emitTelemetry(latest);
  }

  private ensureFlushLoop() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flushTelemetry(), this.EMIT_INTERVAL_MS);
  }

  private stopFlushLoop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private parseLine(raw: string): TelemetryData | null {
    try {
      // 1. Separar el prefijo (CRASH/AVG) de los datos numéricos usando el ":"
      const parts = raw.split(':');
      const dataToParse = parts.length > 1 ? parts[1] : parts[0];

      // 2. Limpiar caracteres no numéricos y separar por comas
      const clean = dataToParse.replace(/\r/g, '').replace(/[^0-9.,\-]/g, '');
      const n = clean.split(',').map(parseFloat);

      // 3. Validar que tengamos los 7 campos (ax, ay, az, gx, gy, gz, gForce)
      if (n.length >= 7 && n.slice(0, 7).every(val => !isNaN(val))) {
        const battery = n.length >= 8 && !Number.isNaN(n[7]) ? Math.max(0, Math.min(100, Math.round(n[7]))) : this.batteryLevel;
        this.batteryLevel = battery ?? null;
        const g = n[6];
        const critical = raw.toUpperCase().startsWith('CRASH') || g >= 5;

        // Campos opcionales del circuito real (hardware con GPS a bordo):
        // ...gForce, battery, latitude, longitude, speed_kmh
        const lat = n.length >= 10 && !Number.isNaN(n[8]) && !Number.isNaN(n[9]) ? n[8] : null;
        const lng = n.length >= 10 && !Number.isNaN(n[8]) && !Number.isNaN(n[9]) ? n[9] : null;
        const validLat = lat !== null && lat >= -90 && lat <= 90 ? lat : null;
        const validLng = lng !== null && lng >= -180 && lng <= 180 ? lng : null;
        const speed = n.length >= 11 && !Number.isNaN(n[10]) && n[10] >= 0 ? n[10] : null;

        return {
          acceleration_x: n[0],
          acceleration_y: n[1],
          acceleration_z: n[2],
          gyroscope_x: n[3],
          gyroscope_y: n[4],
          gyroscope_z: n[5],
          g_force: g,
          battery,
          critical,
          latitude: validLat,
          longitude: validLng,
          speed_kmh: speed,
          timestamp: Date.now()
        };
      }
    } catch (e) {
      console.warn("Error parseando línea:", raw);
    }
    return null;
  }

  // --- Desconexión ---
  async disconnect() {
    this.stopHealthCheck();
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (e) {
        console.log('Error al cancelar conexión:', e);
      }
    }
    this.connected = false;
    this.connectedDevice = null;
    this.readBuffer = '';
    this.batteryLevel = null;
    this.latestTelemetry = null;
    this.lastDataReceivedAt = 0;
    this.stopFlushLoop();
    this.emitDevice(null);
    this.emitStatus('idle');
  }

  // --- Utilidades ---
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const bluetoothService = new BluetoothTelemetryService();
