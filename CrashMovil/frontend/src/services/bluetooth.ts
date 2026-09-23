import { Platform, PermissionsAndroid } from 'react-native';
import BluetoothModule, { BluetoothDevice as ClassicBluetoothDevice } from 'react-native-bluetooth-classic';
import { BleManager, Device as BleDevice, Characteristic } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

if (!global.Buffer) {
  global.Buffer = Buffer;
}

export type BluetoothStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';

export type BluetoothTransport = 'classic' | 'ble';

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
  transport?: BluetoothTransport;
}

const SPP_UUID = '00001101-0000-1000-8000-00805f9b34fb';

const NORDIC_UART_RX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_TX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const CUSTOM_RX_CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';
const CUSTOM_TX_CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';

class UnifiedBluetoothService {
  private telemetryListeners = new Set<(data: TelemetryData) => void>();
  private statusListeners = new Set<(status: BluetoothStatus, detail?: string) => void>();
  private deviceListeners = new Set<(device: ScanDevice | null) => void>();

  private connectedDevice: ClassicBluetoothDevice | BleDevice | null = null;
  private readBuffer = '';
  private connected = false;
  private batteryLevel: number | null = null;
  private lastDataReceivedAt = 0;
  private currentTransport: BluetoothTransport = 'classic';

  private latestTelemetry: TelemetryData | null = null;
  private lastEmitAt = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly EMIT_INTERVAL_MS = 200;
  private readonly EMIT_MIN_GAP_CRITICAL_MS = 0;

  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly HEALTH_CHECK_INTERVAL_MS = 3000;
  private readonly DATA_TIMEOUT_MS = 8000;

  private bleManager: InstanceType<typeof BleManager> | null = null;
  private bleSubscription: any = null;

  constructor() {
    this.initBleManager();
  }

  private initBleManager() {
    if (Platform.OS !== 'web') {
      this.bleManager = new BleManager();
    }
  }

  isNativeAvailable() { return Platform.OS !== 'web'; }
  isConnected() { return this.connected; }
  getConnectedDevice() { return this.connectedDevice; }
  getBatteryLevel() { return this.batteryLevel; }
  getLastDataReceivedAt() { return this.lastDataReceivedAt; }
  getCurrentTransport() { return this.currentTransport; }

  onDeviceChange(l: (d: ScanDevice | null) => void) {
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

  private emitDevice(d: ScanDevice | null) { this.deviceListeners.forEach(l => l(d)); }
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

  async startDeviceScan(onDeviceFound: (device: ScanDevice) => void) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) { this.emitStatus('error', 'Permisos denegados'); return; }

    this.emitStatus('scanning', 'Buscando casco...');

    try {
      await Promise.all([
        this.scanClassicDevices(onDeviceFound),
        this.scanBleDevices(onDeviceFound),
      ]);

      if (!this.connected) this.emitStatus('idle');
    } catch (error) {
      console.error('Error en escaneo:', error);
      this.emitStatus('error', `Error en escaneo: ${error}`);
    }
  }

  private async scanClassicDevices(onDeviceFound: (device: ScanDevice) => void) {
    try {
      const bondedDevices = await BluetoothModule.getBondedDevices();
      for (const device of bondedDevices) {
        if (device.name && device.name.toUpperCase().includes('CRASH')) {
          onDeviceFound({
            id: device.address,
            address: device.address,
            name: device.name,
            isCompatible: true,
            moduleType: 'ESP32 SPP (Classic)',
            connected: false,
            isCrashDevice: true,
            rssi: device.rssi,
            transport: 'classic',
          });
        }
      }

      if (Platform.OS === 'android') {
        const discoveredDevices = await BluetoothModule.startDiscovery();
        for (const device of discoveredDevices) {
          if (device.name && device.name.toUpperCase().includes('CRASH')) {
            onDeviceFound({
              id: device.address,
              address: device.address,
              name: device.name,
              isCompatible: true,
              moduleType: 'ESP32 SPP (Classic)',
              connected: false,
              isCrashDevice: true,
              rssi: device.rssi,
              transport: 'classic',
            });
          }
        }
        await BluetoothModule.cancelDiscovery();
      }
    } catch (error) {
      console.error('Error escaneo Classic:', error);
    }
  }

  private async scanBleDevices(onDeviceFound: (device: ScanDevice) => void) {
    if (!this.bleManager) return;

    return new Promise<void>((resolve) => {
      const foundDevices = new Set<string>();
      
      this.bleManager!.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Error escaneo BLE:', error);
          resolve();
          return;
        }

        if (device && device.name && device.name.toUpperCase().includes('CRASH')) {
          const id = device.id;
          if (!foundDevices.has(id)) {
            foundDevices.add(id);
            onDeviceFound({
              id,
              address: id,
              name: device.name,
              isCompatible: true,
              moduleType: 'ESP32 BLE / HM-10',
              connected: false,
              isCrashDevice: true,
              rssi: device.rssi ?? undefined,
              transport: 'ble',
            });
          }
        }
      });

      setTimeout(() => {
        this.bleManager!.stopDeviceScan();
        resolve();
      }, 10000);
    });
  }

  async connectToDevice(address: string, transport?: BluetoothTransport): Promise<boolean> {
    try {
      const isClassic = transport === 'classic' || (!transport && address.includes(':'));
      this.currentTransport = isClassic ? 'classic' : 'ble';

      if (isClassic) {
        return await this.connectClassic(address);
      } else {
        return await this.connectBle(address);
      }
    } catch (e) {
      console.error('Error conexión:', e);
      this.emitStatus('error', `Error conexión: ${e}`);
      return false;
    }
  }

  private async connectClassic(address: string): Promise<boolean> {
    try {
      this.emitStatus('connecting', 'Conectando por Bluetooth Classic...');

      const device = await BluetoothModule.connectToDevice(address, { uuid: SPP_UUID });

      this.connectedDevice = device;
      this.connected = true;
      this.readBuffer = '';
      this.batteryLevel = null;
      this.lastDataReceivedAt = Date.now();

      device.onDataReceived((data: string) => {
        this.lastDataReceivedAt = Date.now();
        this.readBuffer += data;
        this.processStreamData();
      });

      this.emitDevice({ address: device.address, name: device.name, transport: 'classic' } as ScanDevice);
      this.emitStatus('connected', device.name || 'CRASH-Helmet (Classic)');

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
        this.emitStatus('error', `Error conexión Classic: ${e}`);
      }
      return false;
    }
  }

  private async connectBle(address: string): Promise<boolean> {
    if (!this.bleManager) {
      this.emitStatus('error', 'BLE no disponible');
      return false;
    }

    try {
      this.emitStatus('connecting', 'Conectando por Bluetooth BLE...');

      const device = await this.bleManager.connectToDevice(address);
      await device.discoverAllServicesAndCharacteristics();

      const services = await device.services();
      let rxCharacteristic: Characteristic | null = null;

      for (const service of services) {
        const characteristics = await device.characteristicsForService(service.uuid);
        for (const char of characteristics) {
          const charAny = char as any;
          if (charAny.uuid.toLowerCase() === NORDIC_UART_RX_CHAR.toLowerCase() ||
              charAny.uuid.toLowerCase() === CUSTOM_RX_CHAR.toLowerCase()) {
            if (charAny.properties?.Notify || charAny.properties?.Indicate) {
              rxCharacteristic = char;
              break;
            }
          }
        }
        if (rxCharacteristic) break;
      }

      if (!rxCharacteristic) {
        throw new Error('No se encontró característica RX (notify) compatible');
      }

      this.connectedDevice = device;
      this.connected = true;
      this.readBuffer = '';
      this.batteryLevel = null;
      this.lastDataReceivedAt = Date.now();

      this.bleSubscription = await rxCharacteristic.monitor((error, characteristic) => {
        if (error) {
          console.error('Error BLE monitor:', error);
          return;
        }
        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64').toString('utf-8');
          this.lastDataReceivedAt = Date.now();
          this.readBuffer += data;
          this.processStreamData();
        }
      });

      this.emitDevice({ address: device.id, name: device.name || 'CRASH-BLE', transport: 'ble' } as ScanDevice);
      this.emitStatus('connected', device.name || 'CRASH-Helmet (BLE)');

      this.ensureFlushLoop();
      this.startHealthCheck();
      return true;
    } catch (e) {
      console.error('Error conexión BLE:', e);
      const msg = String(e).toLowerCase();
      if (msg.includes('bond') || msg.includes('pair') || msg.includes('auth')) {
        this.emitStatus('error', 'Dispositivo no emparejado. Empareja en ajustes Bluetooth del sistema.');
      } else if (msg.includes('timeout')) {
        this.emitStatus('error', 'Tiempo de espera agotado. Verifica que el casco esté encendido.');
      } else {
        this.emitStatus('error', `Error conexión BLE: ${e}`);
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
      const trimmed = raw.trim();
      
      let clean: string;
      let isNewFormat = false;
      
      if (trimmed.startsWith('CRASH:')) {
        const parts = trimmed.split(':');
        clean = parts.length > 1 ? parts[1] : parts[0];
      } else {
        clean = trimmed;
        isNewFormat = true;
      }

      clean = clean.replace(/\r/g, '').replace(/[^0-9.,\-]/g, '');
      const n = clean.split(',').map(parseFloat);

      if (isNewFormat) {
        if (n.length >= 8 && n.slice(0, 8).every(val => !isNaN(val))) {
          const accX = n[0];
          const accY = n[1];
          const accZ = n[2];
          const gxDps = n[3];
          const gyDps = n[4];
          const gzDps = n[5];
          const magG = n[6];
          const battery = Math.max(0, Math.min(100, Math.round(n[7])));
          this.batteryLevel = battery;

          const critical = magG >= 5.0;

          return {
            acceleration_x: accX,
            acceleration_y: accY,
            acceleration_z: accZ,
            gyroscope_x: gxDps,
            gyroscope_y: gyDps,
            gyroscope_z: gzDps,
            g_force: magG,
            battery,
            critical,
            latitude: null,
            longitude: null,
            speed_kmh: null,
            timestamp: Date.now()
          };
        }
      } else {
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
      }
    } catch {
      console.warn("Error parseando línea:", raw);
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
        console.warn(`Sin datos (${this.currentTransport}) por ${Math.round(elapsed / 1000)}s. Verificando...`);
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
      let isConn = false;
      if (this.currentTransport === 'classic') {
        isConn = await (this.connectedDevice as ClassicBluetoothDevice).isConnected();
      } else {
        isConn = await (this.connectedDevice as BleDevice).isConnected();
      }
      if (!isConn) {
        console.warn(`Dispositivo ${this.currentTransport} desconectado detectado por health check`);
        this.handleUnexpectedDisconnect();
      }
    } catch {
      console.warn(`No se pudo verificar conexión ${this.currentTransport}`);
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
    if (this.bleSubscription) {
      this.bleSubscription.remove();
      this.bleSubscription = null;
    }
    this.emitDevice(null);
    this.emitStatus('error', `Conexión Bluetooth ${this.currentTransport === 'classic' ? 'Classic' : 'BLE'} perdida. Reconectando...`);
  }

  async disconnect() {
    this.stopHealthCheck();
    this.stopFlushLoop();
    
    if (this.bleSubscription) {
      this.bleSubscription.remove();
      this.bleSubscription = null;
    }
    
    if (this.connectedDevice) {
      try {
        if (this.currentTransport === 'classic') {
          await (this.connectedDevice as ClassicBluetoothDevice).disconnect();
        } else {
          await (this.connectedDevice as BleDevice).cancelConnection();
        }
      } catch (e) {
        console.log('Error al desconectar:', e);
      }
    }
    
    this.connected = false;
    this.connectedDevice = null;
    this.readBuffer = '';
    this.batteryLevel = null;
    this.latestTelemetry = null;
    this.lastDataReceivedAt = 0;
    this.emitDevice(null);
    this.emitStatus('idle');
  }

  async sendCommand(command: string): Promise<boolean> {
    if (!this.connected || !this.connectedDevice) return false;
    
    try {
      const data = command + '\n';
      if (this.currentTransport === 'classic') {
        await (this.connectedDevice as ClassicBluetoothDevice).write(data);
      } else {
        const device = this.connectedDevice as BleDevice;
        const services = await device.services();
        for (const service of services) {
          const characteristics = await device.characteristicsForService(service.uuid);
          for (const char of characteristics) {
            const charAny = char as any;
            if (charAny.uuid.toLowerCase() === NORDIC_UART_TX_CHAR.toLowerCase() ||
                charAny.uuid.toLowerCase() === CUSTOM_TX_CHAR.toLowerCase()) {
              if (charAny.properties?.WriteWithoutResponse || charAny.properties?.Write) {
                await device.writeCharacteristicWithResponseForService(
                  service.uuid, char.uuid, Buffer.from(data).toString('base64')
                );
                return true;
              }
            }
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Error enviando comando:', e);
      return false;
    }
  }
}

export const bluetoothService = new UnifiedBluetoothService();
export type { ClassicBluetoothDevice, BleDevice };