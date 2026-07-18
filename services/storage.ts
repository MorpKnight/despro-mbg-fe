import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStoreModulePromise: Promise<SecureStoreModule | null> | null = null;
let secureStoreAvailable: boolean | null = null;

async function getSecureStoreModule(): Promise<SecureStoreModule | null> {
  if (!secureStoreModulePromise) {
    secureStoreModulePromise = (async () => {
      try {
        const mod = await import('expo-secure-store');
        return mod;
      } catch (err) {
        console.warn('[secureStorage] expo-secure-store unavailable, falling back to AsyncStorage', err);
        return null;
      }
    })();
  }
  return secureStoreModulePromise;
}

async function isSecureStoreAvailable(): Promise<boolean> {
  const secureStore = await getSecureStoreModule();
  if (!secureStore) return false;
  if (secureStoreAvailable === null) {
    try {
      secureStoreAvailable = await secureStore.isAvailableAsync();
    } catch (err) {
      console.warn('[secureStorage] availability check failed', err);
      secureStoreAvailable = false;
    }
  }
  return Boolean(secureStoreAvailable);
}

const extraConfig = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra || {};
const extraApiUrl = typeof extraConfig?.apiUrl === 'string' ? extraConfig.apiUrl : undefined;
const nestedApiUrl = typeof extraConfig?.api?.baseUrl === 'string' ? extraConfig.api.baseUrl : undefined;

const rawDefaultBaseUrl = process.env.EXPO_PUBLIC_API_URL
  || extraApiUrl
  || nestedApiUrl
  || 'http://127.0.0.1:8000/api/v1';

const ALLOW_LOCALHOST_ON_WEB = process.env.EXPO_PUBLIC_ALLOW_LOCALHOST === 'true';

function appendApiSuffix(input: string): string {
  const trimmed = input.trim();
  // Check if URL already has a scheme
  const hasScheme = /^https?:\/\//i.test(trimmed);
  let withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  // Helper to check for localhost
  const isLocalhost = (url: string) => /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|10\.0\.2\.2)(?::\d+)?(\/|$)/i.test(url);

  // Force https for non-localhost URLs (fix for deployed server)
  if (!isLocalhost(withScheme)) {
    withScheme = withScheme.replace(/^http:\/\//i, 'https://');
  }

  const withoutTrailingSlash = withScheme.replace(/\/+$/, '');
  if (withoutTrailingSlash.toLowerCase().endsWith('/api/v1')) {
    return withoutTrailingSlash;
  }
  return `${withoutTrailingSlash}/api/v1`;
}

export function normalizeServerUrl(input?: string | null): string {
  if (!input?.trim()) {
    return appendApiSuffix(rawDefaultBaseUrl);
  }
  return appendApiSuffix(input);
}

function shouldForceCloudUrl(url: string): boolean {
  if (ALLOW_LOCALHOST_ON_WEB) return false;
  if (Platform.OS !== 'web') return false;
  return /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?(\/|$)/i.test(url);
}

export const DEFAULT_BASE_URL = normalizeServerUrl(rawDefaultBaseUrl);

export const SERVER_URL_KEY = 'server_url';
const LOCAL_IP_KEY = 'network:local_ip';
const NETWORK_MODE_KEY = 'network:mode';

export type NetworkMode = 'CLOUD' | 'LOCAL';

export async function getServerUrl(): Promise<string> {
  try {
    const storedUrl = await AsyncStorage.getItem(SERVER_URL_KEY);
    const normalized = storedUrl ? normalizeServerUrl(storedUrl) : DEFAULT_BASE_URL;
    if (shouldForceCloudUrl(normalized)) {
      console.warn('[storage] forcing cloud server URL on web build');
      return DEFAULT_BASE_URL;
    }
    return normalized;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export async function setServerUrl(url: string): Promise<void> {
  try {
    const normalized = normalizeServerUrl(url);
    await AsyncStorage.setItem(SERVER_URL_KEY, normalized);
  } catch (err) {
    console.warn('[storage] failed to set server url', err);
  }
}

export async function saveLocalIp(ip: string): Promise<void> {
  try {
    const sanitized = (ip ?? '').trim();
    if (!sanitized) {
      await AsyncStorage.removeItem(LOCAL_IP_KEY);
      return;
    }
    await AsyncStorage.setItem(LOCAL_IP_KEY, sanitized);
  } catch (err) {
    console.warn('[storage] failed to persist local ip', err);
  }
}

export async function getLocalIp(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(LOCAL_IP_KEY);
    return value ?? null;
  } catch (err) {
    console.warn('[storage] failed to read local ip', err);
    return null;
  }
}

export async function setNetworkMode(mode: NetworkMode): Promise<void> {
  try {
    await AsyncStorage.setItem(NETWORK_MODE_KEY, mode);
  } catch (err) {
    console.warn('[storage] failed to persist network mode', err);
  }
}

export async function getNetworkMode(): Promise<NetworkMode> {
  try {
    const value = await AsyncStorage.getItem(NETWORK_MODE_KEY);
    if (value === 'LOCAL') return 'LOCAL';
    return 'CLOUD';
  } catch (err) {
    console.warn('[storage] failed to read network mode', err);
    return 'CLOUD';
  }
}

export const storage = {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        const mod = await getSecureStoreModule();
        if (mod) {
          return await mod.getItemAsync(key);
        }
      }
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.warn('[secureStorage] get failed', err);
      return null;
    }
  },
  async setItem(key: string, value: string | null): Promise<void> {
    try {
      if (value == null) {
        await secureStorage.removeItem(key);
        return;
      }
      if (await isSecureStoreAvailable()) {
        const mod = await getSecureStoreModule();
        if (mod) {
          const accessible = mod.AFTER_FIRST_UNLOCK ?? undefined;
          await mod.setItemAsync(
            key,
            value,
            accessible ? { keychainService: key, keychainAccessible: accessible } : { keychainService: key },
          );
          return;
        }
      }
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn('[secureStorage] set failed', err);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (await isSecureStoreAvailable()) {
        const mod = await getSecureStoreModule();
        if (mod) {
          await mod.deleteItemAsync(key);
          return;
        }
      }
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('[secureStorage] remove failed', err);
    }
  },
};

export const CENTRAL_API_KEY = 'central_api_key';

/**
 * Get the Central API Key for Edge Mode.
 * This key is used to authenticate requests to the Central Server.
 * Stored securely using expo-secure-store when available.
 */
export async function getCentralApiKey(): Promise<string | null> {
  return await secureStorage.getItem(CENTRAL_API_KEY);
}

/**
 * Set the Central API Key for Edge Mode.
 * @param apiKey - The API key to store, or null to remove it
 */
export async function setCentralApiKey(apiKey: string | null): Promise<void> {
  await secureStorage.setItem(CENTRAL_API_KEY, apiKey);
}

/**
 * Remove the Central API Key from storage.
 */
export async function removeCentralApiKey(): Promise<void> {
  await secureStorage.removeItem(CENTRAL_API_KEY);
}

/**
 * Check if Edge Mode is configured (Central API Key exists).
 */
export async function isEdgeModeConfigured(): Promise<boolean> {
  const apiKey = await getCentralApiKey();
  return apiKey !== null && apiKey.length > 0;
}
