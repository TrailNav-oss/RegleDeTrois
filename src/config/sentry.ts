import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { APP_VERSION, BUILD_NUMBER, IS_EMULATOR } from './app';

const SENTRY_DSN = 'https://c1599b88147ca2e9cf82d544cc0f4987@o4510957630259200.ingest.de.sentry.io/4510997527855184';

export function initSentry() {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      release: `com.regledetrois.app@${APP_VERSION}`,
      dist: String(BUILD_NUMBER),
      environment: __DEV__ ? 'development' : 'production',
      sendDefaultPii: false,
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      sampleRate: __DEV__ ? 1.0 : 0.5,
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      enableAutoSessionTracking: !IS_EMULATOR,
      enableNativeCrashHandling: true,
      debug: false,
      beforeSend(event) {
        if (IS_EMULATOR && !__DEV__) return null;
        return event;
      },
    });
    Sentry.setTag('app_version', APP_VERSION);
    Sentry.setTag('build_number', String(BUILD_NUMBER));
    Sentry.setTag('platform', Platform.OS);
  } catch { /* must not crash */ }
}

export { Sentry };
