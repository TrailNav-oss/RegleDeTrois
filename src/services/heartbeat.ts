import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import { supabase } from '../config/supabase';
import { APP_VERSION, BUILD_NUMBER } from '../config/app';
import { getDeviceId } from './deviceId';

export async function sendHeartbeat(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    const screen = Dimensions.get('screen');
    await supabase.from('device_heartbeats').insert({
      device_id: deviceId,
      app_version: APP_VERSION,
      build_number: BUILD_NUMBER,
      platform: `${Platform.OS} ${Platform.Version}`,
      metadata: {
        device_name: Device.modelName,
        device_brand: Device.brand,
        os_version: Device.osVersion,
        screen_size: `${Math.round(screen.width)}x${Math.round(screen.height)}`,
        is_emulator: !Device.isDevice,
      },
    });
  } catch { /* fire-and-forget */ }
}
