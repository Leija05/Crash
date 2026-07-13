import { NativeModules } from 'react-native';

const { ApkInstaller } = NativeModules;

export function installApk(filePath: string): Promise<boolean> {
  if (!ApkInstaller || !ApkInstaller.installApk) {
    return Promise.reject(new Error('ApkInstaller nativo no disponible'));
  }
  return ApkInstaller.installApk(filePath);
}
