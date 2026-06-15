import { Platform } from 'react-native';

const LOCAL_BACKEND_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:1337' : 'http://localhost:1337';

const normalizeUrl = (value: string | undefined, fallback: string): string =>
  (value?.trim() || fallback).replace(/\/+$/, '');

const getPublicValue = (value: string | undefined): string => value?.trim() || '';

export const environment = {
  apiUrl: normalizeUrl(process.env.EXPO_PUBLIC_API_URL, LOCAL_BACKEND_URL),
  socketUrl: normalizeUrl(
    process.env.EXPO_PUBLIC_SOCKET_URL,
    process.env.EXPO_PUBLIC_API_URL || LOCAL_BACKEND_URL,
  ),
  cloudinary: {
    cloudName: getPublicValue(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME),
    apiKey: getPublicValue(process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY),
  },
} as const;
