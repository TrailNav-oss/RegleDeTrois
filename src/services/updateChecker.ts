import * as Updates from 'expo-updates';

export async function checkForUpdate(): Promise<{ available: boolean; ready: boolean }> {
  if (__DEV__) return { available: false, ready: false };
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return { available: false, ready: false };
    await Updates.fetchUpdateAsync();
    return { available: true, ready: true };
  } catch {
    return { available: false, ready: false };
  }
}

export async function reloadApp(): Promise<void> {
  await Updates.reloadAsync();
}
