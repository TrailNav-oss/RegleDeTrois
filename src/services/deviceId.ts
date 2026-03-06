import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'regledetrois_device_id';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    let id = await AsyncStorage.getItem(KEY);
    if (!id) {
      id = Crypto.randomUUID();
      await AsyncStorage.setItem(KEY, id);
    }
    cached = id;
    return id;
  } catch {
    if (!cached) cached = `fallback-${Date.now()}`;
    return cached;
  }
}
