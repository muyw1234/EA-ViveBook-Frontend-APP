import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const SESSION_END_REASON_KEY = 'sessionEndReason';

export type SessionEntryRoute = 'Main' | 'Discover';
export type SessionEndReason = 'expired' | 'rejected' | 'logout';

export type StoredSession = {
  token: string;
  user: Record<string, unknown>;
};

export type SessionChange =
  | {
      authenticated: true;
      entryRoute: SessionEntryRoute;
      session: StoredSession;
    }
  | {
      authenticated: false;
      reason: SessionEndReason;
    };

type JwtPayload = {
  exp?: number;
};

type SessionListener = (change: SessionChange) => void;

const listeners = new Set<SessionListener>();
let clearingSession: Promise<void> | null = null;

function decodeBase64Url(value: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/u, '');
  let buffer = 0;
  let bits = 0;
  let output = '';

  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) {
      throw new Error('Invalid Base64URL character');
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

function readJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, nowInSeconds = Date.now() / 1000): boolean {
  const payload = readJwtPayload(token);
  if (!payload) {
    return true;
  }

  // Some current Backend tokens do not include exp. They remain compatible
  // until the Backend rejects them, which is handled by the API interceptor.
  return typeof payload.exp === 'number' && payload.exp <= nowInSeconds;
}

function emit(change: SessionChange): void {
  listeners.forEach((listener) => listener(change));
}

export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function saveSession(
  token: string,
  user: Record<string, unknown>,
  entryRoute: SessionEntryRoute = 'Main',
): Promise<void> {
  if (isJwtExpired(token)) {
    await clearSession('expired');
    throw new Error('The received session token is invalid or expired');
  }

  const session = { token, user };
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
  await AsyncStorage.removeItem(SESSION_END_REASON_KEY);
  emit({ authenticated: true, entryRoute, session });
}

export async function restoreSession(): Promise<StoredSession | null> {
  const values = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  const token = values.find(([key]) => key === TOKEN_KEY)?.[1];
  const serializedUser = values.find(([key]) => key === USER_KEY)?.[1];

  if (!token || !serializedUser) {
    if (token || serializedUser) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }
    return null;
  }

  if (isJwtExpired(token)) {
    await clearSession('expired');
    return null;
  }

  try {
    const user = JSON.parse(serializedUser) as Record<string, unknown>;
    return { token, user };
  } catch {
    await clearSession('rejected');
    return null;
  }
}

export async function getValidSessionToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (isJwtExpired(token)) {
    await clearSession('expired');
    return null;
  }

  return token;
}

export async function consumeSessionEndReason(): Promise<Exclude<
  SessionEndReason,
  'logout'
> | null> {
  const reason = await AsyncStorage.getItem(SESSION_END_REASON_KEY);
  await AsyncStorage.removeItem(SESSION_END_REASON_KEY);

  return reason === 'expired' || reason === 'rejected' ? reason : null;
}

export async function clearSession(reason: SessionEndReason = 'logout'): Promise<void> {
  if (clearingSession) {
    return clearingSession;
  }

  clearingSession = (async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

    if (reason === 'expired' || reason === 'rejected') {
      await AsyncStorage.setItem(SESSION_END_REASON_KEY, reason);
    } else {
      await AsyncStorage.removeItem(SESSION_END_REASON_KEY);
    }

    emit({ authenticated: false, reason });
  })();

  try {
    await clearingSession;
  } finally {
    clearingSession = null;
  }
}
