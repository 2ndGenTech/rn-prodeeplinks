export interface DeviceFingerprint {
  platform: 'ios' | 'android';
  osVersion: string;
  deviceId: string;
  deviceModel: string;
  manufacturer?: string;
  screenResolution: string;
  screenWidth: number;
  screenHeight: number;
  timezone?: string;
  language?: string;
  locale?: string;
  appVersion: string;
  carrier?: string;
  connectionType?: string;
  isSimulator?: boolean;
  isRooted?: boolean;
  ipAddress?: string;
}

export interface InitConfig {
  licenseKey: string;
  apiBaseUrl?: string;
  apiPrefix?: string;
  domain?: string;
}

export interface DeepLinkConfig {
  licenseKey: string;
  apiEndpoint: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface DeepLinkResponse {
  success: boolean;
  url?: string | null;
  message?: string;
  error?: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  message?: string;
}

export interface FingerprintBasicPayload {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  timezoneOffset: number;
}

export interface FingerprintNetworkPayload {
  ipAddress: string;
  connectionType: string;
}

export interface FingerprintDevicePayload {
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface FingerprintMatchPayload {
  basic: FingerprintBasicPayload;
  network: FingerprintNetworkPayload;
  device: FingerprintDevicePayload;
  userId?: string;
}

export interface CustomDeepLinkAnalyticsDeviceInfo {
  userAgent?: string;
  language?: string;
  screenResolution?: string;
  platform?: string;
  [key: string]: any;
}

export interface CustomDeepLinkAnalyticsEvent {
  licenseKey?: string;
  eventType: string;
  eventName: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: { [key: string]: any };
  sessionId?: string;
  userId?: string;
  pageUrl?: string;
  pageTitle?: string;
  deviceInfo?: CustomDeepLinkAnalyticsDeviceInfo;
  [key: string]: any;
}

export interface LicenseFeatures {
  maxLinksPerMonth: number;
  maxDomains: number;
  analyticsLevel: string;
  customBranding: boolean;
  webhookSupport: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  rateLimitPerMinute: number;
  [key: string]: any;
}

export interface LicenseUsageCurrentMonth {
  linksCreated: number;
  clicks: number;
  apiCalls: number;
  lastReset: string;
  [key: string]: any;
}

export interface LicenseUsage {
  totalLinksCreated: number;
  totalClicks: number;
  totalApiCalls: number;
  currentMonth: LicenseUsageCurrentMonth;
  [key: string]: any;
}

export interface LicenseData {
  tier: string;
  features: LicenseFeatures;
  validUntil: string;
  usage: LicenseUsage;
  [key: string]: any;
}

export interface LicenseValidationApiResponse {
  success: boolean;
  valid?: boolean;
  data?: LicenseData;
  [key: string]: any;
}

export interface FingerprintMatchInstallInfo {
  _id: string;
  linkId: string;
  installedAt: string;
  timeToInstall: number;
  [key: string]: any;
}

export interface DeepLinkContextMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface DeepLinkContext {
  action: string;
  resourceId?: string;
  params?: { [key: string]: any };
  metadata?: DeepLinkContextMetadata;
  campaign?: string;
  source?: string;
  [key: string]: any;
}

export interface FingerprintMatchResponse {
  matched: boolean;
  matchConfidence?: number;
  install?: FingerprintMatchInstallInfo;
  deepLinkContext?: DeepLinkContext;
  [key: string]: any;
}
