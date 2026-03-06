import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { APP_VERSION } from '../config/app';
import { getDeviceId } from './deviceId';

const CACHE_KEY = 'regledetrois_app_config';

interface AppConfig {
  min_version: string;
  maintenance: boolean;
  maintenance_message: string;
  blocked_devices: string[];
  custom_message: string;
}

export interface BlockStatus {
  blocked: boolean;
  reason: string;
}

export async function fetchAppConfig(): Promise<BlockStatus> {
  let config: AppConfig = {
    min_version: '0.0.0',
    maintenance: false,
    maintenance_message: '',
    blocked_devices: [],
    custom_message: '',
  };

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) config = JSON.parse(cached);
  } catch {}

  try {
    const { data, error } = await Promise.race([
      supabase.from('app_config').select('*').eq('id', 1).single(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]);
    if (!error && data) {
      config = data as AppConfig;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config)).catch(() => {});
    }
  } catch {}

  if (config.maintenance) {
    return { blocked: true, reason: config.maintenance_message || 'Maintenance en cours' };
  }

  const deviceId = await getDeviceId();
  if (config.blocked_devices.includes(deviceId)) {
    return { blocked: true, reason: 'Acces revoque' };
  }

  const cmp = (a: string, b: string) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const d = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (d) return d;
    }
    return 0;
  };

  if (cmp(APP_VERSION, config.min_version) < 0) {
    return { blocked: true, reason: `Mise a jour requise (min ${config.min_version})` };
  }

  return { blocked: false, reason: config.custom_message };
}
