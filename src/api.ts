import {
  DeepLinkConfig,
  DeepLinkResponse,
  DeviceFingerprint,
  FingerprintMatchPayload,
  CustomDeepLinkAnalyticsEvent,
  LicenseValidationApiResponse,
  FingerprintMatchResponse,
} from './types';
import { validateLicenseKeyFormat } from './license';

const BASE_API_URL = 'https://api.prodeeplinks.com';
const ANALYTICS_ENDPOINT = `${BASE_API_URL}/custom-deep-link/track/event`;

/**
 * Call API to get deep link URL
 * This function sends device fingerprint and license key to server
 */
export async function fetchDeepLinkUrl(
  licenseKey: string,
  fingerprint: DeviceFingerprint,
  apiEndpoint?: string,
  timeout: number = 10000
): Promise<DeepLinkResponse> {
  const endpoint = apiEndpoint || BASE_API_URL;
  
  try {
    // Validate license key format first
    const validation = validateLicenseKeyFormat(licenseKey);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.message || 'Invalid license key',
      };
    }

    
    const payload = {
      licenseKey,
      fingerprint: fingerprint,
      timestamp: Date.now(),
    };

    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-license-key': licenseKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      
      if (data.success) {
        if (data.url) {
          return {
            success: true,
            url: data.url,
            message: data.message,
          };
        } else {
          // Success true but no URL means no match found - this is not an error
          return {
            success: true,
            url: null,
            message: data.message || 'No deep link available',
          };
        }
      } else {
        return {
          success: false,
          error: data.message || 'No URL returned from API',
        };
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Error fetching deep link URL:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch deep link URL',
    };
  }
}

/**
 * Retry mechanism for API calls
 */
export async function fetchDeepLinkUrlWithRetry(
  licenseKey: string,
  fingerprint: DeviceFingerprint,
  retryAttempts: number = 3,
  apiEndpoint?: string,
  timeout: number = 10000
): Promise<DeepLinkResponse> {
  let lastError: DeepLinkResponse | null = null;
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    const result = await fetchDeepLinkUrl(licenseKey, fingerprint, apiEndpoint, timeout);
    
    if (result.success) {
      return result;
    }
    
    lastError = result;
    
    // Don't retry on license validation errors
    if (result.error?.includes('license') || result.error?.includes('Invalid')) {
      return result;
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < retryAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return lastError || {
    success: false,
    error: 'Failed after retries',
  };
}

export async function validateLicenseCustom(
  licenseKey: string,
  opts?: {
    baseUrl?: string;
    apiPrefix?: string;
    domain?: string;
    ipAddress?: string;
  }
): Promise<LicenseValidationApiResponse> {
  try {
    const base = (opts?.baseUrl || '').trim();
    const prefix = (opts?.apiPrefix || '').trim();
    const endpoint = `${base}${prefix}/custom-deep-link/license/validate`;
    const body = {
      licenseKey,
      domain: opts?.domain || '',
      ipAddress: opts?.ipAddress || '',
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as LicenseValidationApiResponse;
    return json;
  } catch (e) {
    return { success: false, error: (e as any)?.message || 'License validate failed' };
  }
}

export async function validateLicenseInit(licenseKey: string): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  data?: LicenseValidationApiResponse;
}> {
  try {
    const endpoint = `${BASE_API_URL}/custom-deep-link/license/validate`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-license-key': licenseKey,
      },
      body: JSON.stringify({ licenseKey }),
    });
    const data = (await res.json().catch(() => ({}))) as LicenseValidationApiResponse;
    if (!res.ok) {
      const message = data?.message || data?.error || 'License validation failed';
      return { success: false, error: message, status: res.status, data };
    }
    if (!data.success || !data.valid) {
      const message = (data as any)?.message || (data as any)?.error || 'License is not valid';
      return { success: false, error: message, status: res.status, data };
    }
    return { success: true, status: res.status, data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || 'License validation request failed',
    };
  }
}

export async function matchFingerprintCustom(
  payload: FingerprintMatchPayload,
  baseUrl?: string,
  licenseKey?: string
): Promise<FingerprintMatchResponse> {
  try {
    const base = (baseUrl || BASE_API_URL).trim().replace(/\/+$/, '');
    const endpoint = `${base}/custom-deep-link/fingerprint/match`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(licenseKey ? { 'x-license-key': licenseKey } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as FingerprintMatchResponse;
    return data;
  } catch (e: any) {
    return {
      matched: false,
      matchConfidence: 0,
      ...(e ? { error: e?.message || 'Fingerprint match failed' } : {}),
    } as any;
  }
}

export async function trackCustomDeepLinkEvent(
  event: CustomDeepLinkAnalyticsEvent,
  licenseKey?: string
): Promise<any> {
  try {
    const res = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(licenseKey ? { 'x-license-key': licenseKey } : {}),
      },
      body: JSON.stringify(event),
    });
    const data = await res.json().catch(() => ({}));
    return data;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Analytics event tracking failed' };
  }
}
