import DeviceInfo from 'react-native-device-info';
import { Platform, Dimensions } from 'react-native';
import { DeviceFingerprint } from './types';
import NetInfo from '@react-native-community/netinfo';

/**
 * Generate device fingerprint for deep link matching
 * Collects all device information required for fingerprint matching
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  try {
    const { width, height } = Dimensions.get('window');
    const screenResolution = `${width}x${height}`;
    
    // Get device info
    const deviceId = await DeviceInfo.getUniqueId();
    const deviceModel = DeviceInfo.getModel();
    const manufacturer = Platform.OS === 'android' ? await DeviceInfo.getManufacturer() : 'Apple';
    const osVersion = DeviceInfo.getSystemVersion();
    const appVersion = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();
    const isSimulator = await DeviceInfo.isEmulator();
    const isRooted = Platform.OS === 'android'
      ? (await ((DeviceInfo as any).isDeviceRooted?.() ?? false))
      : false;
    
    const deviceLocales = (DeviceInfo as any).getDeviceLocales?.(); 
    const primaryLocale = Array.isArray(deviceLocales) && deviceLocales.length > 0 ? deviceLocales[0] : undefined; 
    const legacyLocale = (DeviceInfo as any).getDeviceLocale?.(); 
    const locale = (primaryLocale || legacyLocale || Intl.DateTimeFormat().resolvedOptions().locale) || 'en'; 
    const language = (locale || '').split('-')[0] || 'en';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get network info
    const netInfo = await NetInfo.fetch();
    const connectionType = netInfo.type;
    const carrier = Platform.OS === 'ios' ? await DeviceInfo.getCarrier() : undefined;
    
    // Get IP address (if available)
    let ipAddress: string | undefined;
    try {
      // Prefer device info API if available
      ipAddress = await ((DeviceInfo as any).getIpAddress?.() ?? undefined);
      // Fallback to network info if not available
      if (!ipAddress && netInfo.details && 'ipAddress' in netInfo.details) {
        ipAddress = (netInfo.details as any).ipAddress;
      }
    } catch (error) {
      console.warn('Could not get IP address:', error);
    }
    
    const fingerprint: DeviceFingerprint = {
      platform: Platform.OS as 'ios' | 'android',
      osVersion,
      deviceId,
      deviceModel,
      manufacturer,
      screenResolution,
      screenWidth: width,
      screenHeight: height,
      timezone,
      language,
      locale,
      appVersion: `${appVersion} (${buildNumber})`,
      carrier,
      connectionType: connectionType || undefined,
      isSimulator,
      isRooted,
      ipAddress,
    };
    
    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Return minimal fingerprint on error
    const { width, height } = Dimensions.get('window');
    return {
      platform: Platform.OS as 'ios' | 'android',
      osVersion: Platform.Version.toString(),
      deviceId: 'unknown',
      deviceModel: 'unknown',
      screenResolution: `${width}x${height}`,
      screenWidth: width,
      screenHeight: height,
      appVersion: 'unknown',
    };
  }
}
