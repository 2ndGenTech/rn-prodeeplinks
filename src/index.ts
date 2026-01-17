import {
  InitConfig,
  DeepLinkResponse,
  CustomDeepLinkAnalyticsEvent,
  DeviceFingerprint,
} from './types';
import { generateDeviceFingerprint } from './fingerprint';
import { fetchDeepLinkUrlWithRetry, validateLicenseInit, trackCustomDeepLinkEvent } from './api';
import { validateLicenseKeyFormat } from './license';
import { Linking } from 'react-native';

// Global state to store license key and configuration
let storedLicenseKey: string | null = null;
let isInitialized: boolean = false;

// Hardcoded API endpoint - user doesn't need to know about this
const DEFAULT_API_ENDPOINT = 'https://api.prodeeplink.com/v1/deeplink';

/**
 * Initialize the deep link package with license key
 * This must be called before using getDeepLink()
 * 
 * @param config - Configuration object containing license key
 * @returns Object with success status and optional error message
 * 
 * @example
 * ```typescript
 * import { init } from 'rn-prodeeplinks';
 * 
 * const result = await init({ licenseKey: 'your-license-key-here' });
 * if (result.success) {
 *   console.log('Initialized successfully');
 * }
 * ```
 */
export async function init(config: InitConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = validateLicenseKeyFormat(config.licenseKey);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.message || 'Invalid license key',
      };
    }

    const remoteValidation = await validateLicenseInit(config.licenseKey);
    if (!remoteValidation.success) {
      return {
        success: false,
        error: remoteValidation.error || 'License validation failed',
      };
    }

    storedLicenseKey = config.licenseKey;
    isInitialized = true;

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to initialize',
    };
  }
}

async function trackDeepLinkResolved(
  url: string,
  source: 'linking' | 'api',
  fingerprint?: DeviceFingerprint
): Promise<void> {
  const event: CustomDeepLinkAnalyticsEvent = {
    eventType: 'deeplink',
    eventName: 'pro_track',
    category: source,
    action: 'open',
    label: url,
    properties: {
     shortUrl: url, 
      source,
      fingerprint,
    },
  };

  try {
    await trackAnalyticsEvent(event as CustomDeepLinkAnalyticsEvent);
  } catch {
  }
}

/**
 * Get deep link URL from server
 * This function automatically handles device fingerprinting internally
 * 
 * @param callback - Optional callback function that receives the deep link URL
 * @returns Promise with deep link response
 * 
 * @example
 * ```typescript
 * import { getDeepLink } from 'rn-prodeeplinks';
 * 
 * // Using promise
 * const result = await getDeepLink();
 * if (result.success && result.url) {
 *   console.log('Deep link:', result.url);
 * }
 * 
 * // Using callback
 * getDeepLink((url) => {
 *   console.log('Deep link:', url);
 * });
 * ```
 */
export async function getDeepLink(
  callback?: (url: string) => void
): Promise<DeepLinkResponse> {
  // Check if initialized
  if (!isInitialized || !storedLicenseKey) {
    return {
      success: false,
      error: 'Please call init() first with your license key',
    };
  }

  try {
    // First: try to read deep link via Linking (if app opened by URL)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      try {
        const fingerprint = await generateDeviceFingerprint();
        await trackDeepLinkResolved(initialUrl, 'linking', fingerprint);
      } catch {
      }
      if (callback) callback(initialUrl);
      return { success: true, url: initialUrl };
    }

    // Generate device fingerprint internally (user doesn't need to know about this)
    const fingerprint = await generateDeviceFingerprint();
    
    // Fetch deep link URL from API with retry mechanism
    const result = await fetchDeepLinkUrlWithRetry(
      storedLicenseKey,
      fingerprint,
      3, // retry attempts
      DEFAULT_API_ENDPOINT
    );

    if (result.success && result.url) {
      try {
        await trackDeepLinkResolved(result.url, 'api', fingerprint);
      } catch {
      }
    }

    // Call callback if provided and result is successful
    if (callback && result.success && result.url) {
      callback(result.url);
    }

    // If API didn't return a usable URL, return null as per requirements
    if (!result.success || !result.url) {
      return { success: true, url: null, message: 'No deep link available' };
    }

    return result;
  } catch (error: any) {
    console.error('Error in getDeepLink:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Check if the package is initialized
 */
export function isReady(): boolean {
  return isInitialized && storedLicenseKey !== null;
}

/**
 * Reset/clear the stored license key
 * Useful for testing or logout scenarios
 */
export function reset(): void {
  storedLicenseKey = null;
  isInitialized = false;
}

export async function trackAnalyticsEvent(
  event: CustomDeepLinkAnalyticsEvent
): Promise<any> {
  if (!isInitialized || !storedLicenseKey) {
    return {
      success: false,
      error: 'Please call init() first with your license key',
    };
  }
  const { licenseKey: _ignored, ...payload } = event as any;
  return trackCustomDeepLinkEvent(payload as CustomDeepLinkAnalyticsEvent, storedLicenseKey);
}

// Export types (but hide internal types from users)
export type { InitConfig, DeepLinkResponse, CustomDeepLinkAnalyticsEvent } from './types';

// Keep backward compatibility - export class for advanced users (optional)
export class ProDeepLink {
  private licenseKey: string;

  constructor(config: InitConfig) {
    const validation = validateLicenseKeyFormat(config.licenseKey);
    if (!validation.isValid) {
      throw new Error(validation.message || 'Invalid license key');
    }
    this.licenseKey = config.licenseKey;
  }

  async getDeepLinkUrl(): Promise<DeepLinkResponse> {
    const remoteValidation = await validateLicenseInit(this.licenseKey);
    if (!remoteValidation.success) {
      return {
        success: false,
        error: remoteValidation.error || 'License validation failed',
      };
    }
    const fingerprint = await generateDeviceFingerprint();
    const result = await fetchDeepLinkUrlWithRetry(
      this.licenseKey,
      fingerprint,
      3,
      DEFAULT_API_ENDPOINT
    );
    if (result.success && result.url) {
      try {
        await trackDeepLinkResolved(result.url, 'api', fingerprint);
      } catch {
      }
    }
    return result;
  }
}

// Export default
export default { init, getDeepLink, isReady, reset, trackAnalyticsEvent };
