declare module 'react-native-bluetooth-classic' {
  export interface BluetoothDevice {
    name: string;
    address: string;
    id: string;
    bonded?: boolean;
    deviceClass?: number;
    rssi?: number;
    type?: string;
    extra?: any;
    connect: (options?: any) => Promise<boolean>;
    isConnected: () => Promise<boolean>;
    disconnect: () => Promise<boolean>;
    onDataReceived: (listener: (data: string) => void) => void;
    write: (data: string, encoding?: string) => Promise<void>;
    available: () => Promise<number>;
    read: () => Promise<string>;
    clear: () => Promise<boolean>;
  }

  export interface BluetoothModuleType {
    isBluetoothEnabled(): Promise<boolean>;
    getBondedDevices(): Promise<BluetoothDevice[]>;
    startDiscovery(): Promise<BluetoothDevice[]>;
    cancelDiscovery(): Promise<void>;
    connectToDevice(address: string, options?: any): Promise<BluetoothDevice>;
    getConnectedDevices(): Promise<BluetoothDevice[]>;
    getConnectedDevice(address: string): Promise<BluetoothDevice>;
    writeToDevice(address: string, message: string, encoding?: string): Promise<void>;
    removeAllListeners(): void;
  }

  const BluetoothModule: BluetoothModuleType;
  export default BluetoothModule;
}