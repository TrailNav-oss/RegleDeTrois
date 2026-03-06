import Constants from 'expo-constants';
import * as Device from 'expo-device';

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.2';
export const BUILD_NUMBER = Constants.expoConfig?.android?.versionCode ?? 1;
export const IS_EMULATOR = !Device.isDevice;
export const PACKAGE_NAME = 'com.regledetrois.app';
