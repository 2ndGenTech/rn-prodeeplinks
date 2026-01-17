# rn-prodeeplinks

**PAID PACKAGE** - Secure deep linking package for React Native with license key validation and device fingerprinting.

> ⚠️ **License Required**: This package requires a valid license key purchased from our portal. Without a license key, the package will not function.

> ℹ️ **Versioning**: Current version is 0.0.1 (in-progress). It will move to 1.x after stable.

## Features

- 🔐 **License Key Protection** - Secure license key validation
- 🔗 **Deep Link Management** - Server-side deep link URL management
- 🛡️ **Code Protection** - Built-in protection against code extraction
- ⚡ **Retry Mechanism** - Automatic retry with exponential backoff
- 📊 **TypeScript Support** - Full TypeScript definitions included

## Getting Started

### Step 1: Purchase License Key

Before using this package, you must purchase a license key from our portal. The license key will be provided after successful payment.

### Step 2: Installation

```bash
npm install rn-prodeeplinks
```

### Step 3: Install Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react-native-device-info @react-native-community/netinfo
```

## Usage
### Deep Link Resolution Flow
- First checks React Native Linking for an initial URL (if app opened via deep link).
- If none, calls fingerprint-based API to resolve server-managed deep link.
- If neither returns a URL, returns null.

### Basic Usage

```typescript
import { init, getDeepLink } from 'rn-prodeeplinks';

// Step 1: Initialize with your license key (obtained from our portal after payment)
const initResult = await init({
  licenseKey: 'your-license-key-from-portal' // REQUIRED: Purchase from our portal
});

if (!initResult.success) {
  console.error('Initialization failed:', initResult.error);
  return;
}

// Step 2: Get deep link URL (Linking-first, then API, else null)
const result = await getDeepLink();

if (result.success && result.url) {
  // Use the URL for deep linking
  console.log('Deep link URL:', result.url);
  // Use Linking.openURL(result.url) or your preferred method
} else {
  // Either API error or flow returned null
  console.log('No deep link available or error:', result.error);
}
```

### Using Callback

```typescript
import { init, getDeepLink } from 'rn-prodeeplinks';

// Initialize once
await init({ licenseKey: 'your-license-key-here' });

// Get deep link with callback
getDeepLink((url) => {
  console.log('Deep link URL:', url);
  // Handle the deep link URL
});
```

### Complete Example

```typescript
import { init, getDeepLink, isReady } from 'rn-prodeeplinks';
import { Linking } from 'react-native';

async function setupDeepLink() {
  // Initialize with license key
  const initResult = await init({
    licenseKey: 'your-license-key-here'
  });

  if (!initResult.success) {
    console.error('Failed to initialize:', initResult.error);
    return;
  }

  // Check if ready
  if (isReady()) {
    // Get deep link
    const result = await getDeepLink();
    
    if (result.success && result.url) {
      // Open the deep link
      await Linking.openURL(result.url);
    } else {
      // If null, there is no deep link to process
      console.log('Deep link unavailable:', result.error);
    }
  }
}
```

### Advanced Usage (Class-based - Optional)

For advanced users who prefer class-based approach:

```typescript
import { ProDeepLink } from 'rn-prodeeplinks';

const deepLink = new ProDeepLink({
  licenseKey: 'your-license-key-here'
});

const result = await deepLink.getDeepLinkUrl();
```

## API Reference

### Functions

#### `init(config: InitConfig): Promise<{ success: boolean; error?: string }>`

Initializes the package with your license key. This must be called before using `getDeepLink()`.

**Parameters:**
- `config.licenseKey` (string, required): Your license key from the portal

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
const result = await init({ licenseKey: 'your-license-key' });
```

#### `getDeepLink(callback?: (url: string) => void): Promise<DeepLinkResponse>`

Fetches the deep link URL from the server.

**Parameters:**
- `callback` (optional): Callback function that receives the deep link URL when successful

**Returns:**
```typescript
{
  success: boolean;
  url?: string | null;
  message?: string;
  error?: string;
}
```

**Example:**
```typescript
// Using promise
const result = await getDeepLink();

// Using callback
getDeepLink((url) => {
  console.log('Deep link:', url);
});
```

#### `isReady(): boolean`

Checks if the package has been initialized with a license key.

**Returns:** `boolean`

#### `reset(): void`

Resets/clears the stored license key. Useful for testing or logout scenarios.

### ProDeepLink Class (Advanced - Optional)

For users who prefer class-based approach:

#### Constructor

```typescript
new ProDeepLink(config: InitConfig)
```

**Config Options:**
- `licenseKey` (string, required): Your license key

#### Methods

##### `getDeepLinkUrl(): Promise<DeepLinkResponse>`

Fetches the deep link URL from the server.

## Security Features

1. **License Key Protection** - Secure license key validation and obfuscation
2. **Server-Side Validation** - All license validation happens on our secure server
3. **Secure API Endpoint** - All communication happens through our encrypted API endpoint
4. **Code Protection** - Built-in measures to prevent code extraction

## License Key

### Obtaining a License Key

License keys are **NOT FREE**. You must:
1. Visit our payment portal
2. Complete the purchase process
3. Receive your unique license key via email/portal
4. Use the license key to initialize this package

### License Validation

- License keys are validated on **every API call** to our server
- Invalid or expired license keys will result in API errors
- License keys cannot be shared or reused without authorization

### Custom License Validate API (Optional)
For environments with a custom auth API, the license validate endpoint is:

POST {{base_url}}{{api_prefix}}/custom-deep-link/license/validate

Example (Postman):

```
POST '{{base_url}}{{api_prefix}}/custom-deep-link/license/validate'
  --header 'Content-Type: application/json'
  --body '{
    "licenseKey": "{{license_key}}",
    "domain": "acme.com",
    "ipAddress": "103.21.149.10"
  }'
```

This package exposes a helper to call this endpoint if needed. It does not interfere with the main deep link resolution flow.

## Error Handling

The package handles various error scenarios:

- Invalid license key
- Network timeouts
- API errors

All errors are returned in the `DeepLinkResponse` object with descriptive error messages.

## TypeScript Support

Full TypeScript definitions are included. Import types as needed:

```typescript
import { InitConfig, DeepLinkResponse } from 'rn-prodeeplinks';
```

**Available Types:**
- `InitConfig` - Configuration for initialization
- `DeepLinkResponse` - Response from getDeepLink()

## Troubleshooting

### License Key Errors

If you receive license key errors:
1. Ensure you've called `init()` before using `getDeepLink()`
2. Check that the license key is valid on our portal
3. Verify the license key hasn't expired
4. Make sure you're using the correct license key

### Network Errors

If you encounter network errors:
1. Check your internet connection
2. Verify you have proper network permissions
3. Check if our API endpoint is accessible from your network
4. Try again after a few moments (automatic retry is built-in)

### Initialization Errors

If initialization fails:
1. Make sure you're calling `init()` before `getDeepLink()`
2. Verify the license key is correct
3. Check that `isReady()` returns `true` before making API calls

## Payment & Licensing

This is a **paid package**. To use this package:

1. **Purchase**: Visit our payment portal and purchase a license
2. **Get License Key**: Receive your unique license key after payment
3. **Use Package**: Initialize the package with your license key using `init()`
4. **Server Validation**: Our server validates the license key on each request

### Important Notes

- ❌ **No license key = Package will not work**
- ❌ **Invalid license key = API calls will fail**
- ❌ **Expired license key = Access denied**
- ❌ **Not initialized = getDeepLink() will fail**
- ✅ **Valid license key + init() = Full access to all features**
- ✅ **API endpoint = Managed by us (no setup required)**

## Support

For support regarding:
- **License keys**: Contact our payment portal support
- **Technical issues**: Check the documentation or contact technical support
- **Payment issues**: Contact billing support

## License

This package is proprietary software. Unauthorized copying, distribution, or use without a valid license key is prohibited and may result in legal action.
