import * as Haptics from 'expo-haptics';

export function lightHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

export function mediumHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
}

export function successHaptic() {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
}

export function errorHaptic() {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
}
