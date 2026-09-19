import { Platform, PermissionsAndroid } from 'react-native';
import BluetoothModule, { BluetoothDevice } from 'react-native-bluetooth-classic';
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

const SPP_UUID = '00001101-0000-1000-8000-00805f9b34fb';
const DATA_PREFIX = 'CRASH';

class BluetoothClassicTelemetryService {
  private telemetryListeners = new Set<(data: TelemetryData) => void>();
  private statusListeners = new Set<(status: BluetoothStatus, detail?: string) => void>();
  private deviceListeners = new Set<(device: any | null) => void>();

  private connectedDevice: BluetoothDevice | null = null;
  private readBuffer = '';
  private connected = false;
  private batteryLevel: number | null = null;
  private lastDataReceivedAt = 0;

  private latestTelemetry: TelemetryData | null = null;
  private lastEmitAt = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly EMIT_INTERVAL_MS = 100;
  private readonly EMIT_MIN_GAP_CRITICAL_MS = 50;

  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly HEALTH_CHECK_INTERVAL_MS = 3000;
  private readonly DATA_TIMEOUT_MS = 8000;

  constructor() {
    // No global event listeners needed - we use per-device onDataReceived
  }

  isNativeAvailable() { return Platform.OS !== 'web'; }
  isConnected() { return this.connected; }
  getConnectedDevice() { return this.connectedDevice; }
  getBatteryLevel() { return this.batteryLevel; }
  getLastDataReceivedAt() { return this.lastDataReceivedAt; }

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

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const api = parseInt(Platform.Version.toString(), 10);
      const perms: string[] = api >= 31
        ? [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]
        : ['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN'];
      if (api >= 33) {
        perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      const granted = await PermissionsAndroid.requestMultiple(perms as never);
      return Object.values(granted).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
    } catch { return false; }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const enabled = await BluetoothModule.isBluetoothEnabled();
      return enabled;
    } catch { return false; }
  }

  async startDeviceScan(onDeviceFound: (device: any) => void) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) { this.emitStatus('error', 'Permisos denegados'); return; }

    this.emitStatus('scanning', 'Buscando casco...');

    try {
      // 1. Dispositivos ya emparejados (bonded)
      const bondedDevices = await BluetoothModule.getBondedDevices();
      for (const device of bondedDevices) {
        if (device.name && device.name.toUpperCase().includes('CRASH')) {
          onDeviceFound({
            id: device.address,
            address: device.address,
            name: device.name,
            isCompatible: true,
            moduleType: 'ESP32 SPP',
            connected: false,
            isCrashDevice: true,
            rssi: device.rssi,
          });
        }
      }

      // 2. Descubrir nuevos dispositivos (inquiry) - Android only
      if (Platform.OS === 'android') {
        const discoveredDevices = await BluetoothModule.startDiscovery();
        for (const device of discoveredDevices) {
          if (device.name && device.name.toUpperCase().includes('CRASH')) {
            onDeviceFound({
              id: device.address,
              address: device.address,
              name: device.name,
              isCompatible: true,
              moduleType: 'ESP32 SPP',
              connected: false,
              isCrashDevice: true,
              rssi: device.rssi,
            });
          }
        }
        await BluetoothModule.cancelDiscovery();
      }

      if (!this.connected) this.emitStatus('idle');
    } catch (error) {
      console.error('Error en escaneo Classic:', error);
      this.emitStatus('error', `Error en escaneo: ${error}`);
    }
  }

  async connectToDevice(address: string): Promise<boolean> {
    try {
      this.emitStatus('connecting', 'Conectando por Bluetooth Classic...');

      // Conectar via SPP (RFCOMM) - options with UUID for SPP
      const device = await BluetoothModule.connectToDevice(address, { uuid: SPP_UUID });

      this.connectedDevice = device;
      this.connected = true;
      this.readBuffer = '';
      this.batteryLevel = null;
      this.lastDataReceivedAt = Date.now();

      // Configurar listener de datos entrantes
      device.onDataReceived((data: string) => {
        this.lastDataReceivedAt = Date.now();
        this.readBuffer += data;
        this.processStreamData();
      });

      this.emitDevice({ address: device.address, name: device.name });
      this.emitStatus('connected', device.name || 'CRASH-Helmet');

      this.ensureFlushLoop();
      this.startHealthCheck();
      return true;
    } catch (e) {
      console.error('Error conexión Classic:', e);
      const msg = String(e).toLowerCase();
      if (msg.includes('bond') || msg.includes('pair')) {
        this.emitStatus('error', 'Dispositivo no emparejado. Empareja en ajustes Bluetooth del sistema.');
      } else if (msg.includes('timeout')) {
        this.emitStatus('error', 'Tiempo de espera agotado. Verifica que el casco esté encendido.');
      } else {
        this.emitStatus('error', `Error conexión: ${e}`);
      }
      return false;
    }
  }

  private processStreamData() {
    if (this.readBuffer.length > 4096) {
      const lastNl = this.readBuffer.lastIndexOf('\n');
      this.readBuffer = lastNl >= 0 ? this.readBuffer.slice(lastNl + 1) : '';
    }

    let breakIndex = this.readBuffer.indexOf('\n');
    while (breakIndex !== -1) {
      const line = this.readBuffer.slice(0, breakIndex).trim();
      this.readBuffer = this.readBuffer.slice(breakIndex + 1);

      if (line.length > 0) {
        const parsed = this.parseLine(line);
        if (parsed) {
          this.latestTelemetry = parsed;
          if (parsed.critical && Date.now() - this.lastEmitAt >= this.EMIT_MIN_GAP_CRITICAL_MS) {
            this.flushTelemetry();
          }
        }
      }
      breakIndex = this.readBuffer.indexOf('\n');
    }
    this.ensureFlushLoop();
  }

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
      const parts = raw.split(':');
      const dataToParse = parts.length > 1 ? parts[1] : parts[0];

      const clean = dataToParse.replace(/\r/g, '').replace(/[^0-9.,\-]/g, '');
      const n = clean.split(',').map(parseFloat);

      if (n.length >= 7 && n.slice(0, 7).every(val => !isNaN(val))) {
        const battery = n.length >= 8 && !Number.isNaN(n[7]) 
          ? Math.max(0, Math.min(100, Math.round(n[7]))) 
          : this.batteryLevel;
        this.batteryLevel = battery ?? null;
        
        const g = n[6];
        const critical = g >= 5;

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
      console.warn("Error parseando línea Classic:", raw);
    }
    return null;
  }

  private startHealthCheck() {
    this.stopHealthCheck();
    this.lastDataReceivedAt = Date.now();
    this.healthCheckTimer = setInterval(async () => {
      if (!this.connected || !this.connectedDevice) {
        this.stopHealthCheck();
        return;
      }
      const elapsed = Date.now() - this.lastDataReceivedAt;
      if (elapsed > this.DATA_TIMEOUT_MS && this.connected) {
        console.warn(`Sin datos Classic por ${Math.round(elapsed / 1000)}s. Verificando...`);
        await this.checkDeviceConnection();
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
        console.warn('Dispositivo Classic desconectado detectado por health check');
        this.handleUnexpectedDisconnect();
      }
    } catch {
      console.warn('No se pudo verificar conexión Classic');
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
    this.emitDevice(null);
    this.emitStatus('error', 'Conexión Bluetooth Classic perdida. Reconectando...');
  }

  async disconnect() {
    this.stopHealthCheck();
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.disconnect();
      } catch (e) {
        console.log('Error al desconectar Classic:', e);
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
}

export const bluetoothService = new BluetoothClassicTelemetryService();