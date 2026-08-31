const PIN_KEY = 'griyakas_security_pin_v2';
const LEGACY_V1_PIN_KEY = 'griyakas_admin_pin_v1';
const ITERATIONS = 210_000;

type StoredPin = { version: 1; salt: string; hash: string; iterations: number };

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const derive = async (pin: string, salt: Uint8Array, iterations: number) => {
  if (!crypto?.subtle) throw new Error('Browser tidak mendukung Web Crypto.');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256);
  return new Uint8Array(bits);
};

const equalBytes = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
};

const parseStored = (raw: string | null): StoredPin | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredPin>;
    if (typeof value.salt === 'string' && typeof value.hash === 'string') {
      return { version: 1, salt: value.salt, hash: value.hash, iterations: Number(value.iterations) || 120_000 };
    }
  } catch {
    // The early v2 preview stored a 4-digit PIN as plain text. It is migrated after a successful unlock.
  }
  return null;
};

export const hasSecurityPin = () => Boolean(localStorage.getItem(PIN_KEY) || localStorage.getItem(LEGACY_V1_PIN_KEY));

export const setSecurityPin = async (pin: string | null) => {
  if (!pin) {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(LEGACY_V1_PIN_KEY);
    return;
  }
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN harus tepat 4 digit.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  const stored: StoredPin = { version: 1, salt: bytesToBase64(salt), hash: bytesToBase64(hash), iterations: ITERATIONS };
  localStorage.setItem(PIN_KEY, JSON.stringify(stored));
  localStorage.removeItem(LEGACY_V1_PIN_KEY);
};

const verifyHash = async (pin: string, stored: StoredPin) => {
  const actual = await derive(pin, base64ToBytes(stored.salt), stored.iterations);
  return equalBytes(actual, base64ToBytes(stored.hash));
};

export const verifySecurityPin = async (pin: string) => {
  const currentRaw = localStorage.getItem(PIN_KEY);
  const current = parseStored(currentRaw);
  if (current) return verifyHash(pin, current);

  // Migrate the early v2 plaintext format only after the user proves knowledge of the PIN.
  if (currentRaw && /^\d{4}$/.test(currentRaw) && currentRaw === pin) {
    await setSecurityPin(pin);
    return true;
  }

  // v1 used the same PBKDF2-shaped record under another key. Verify and promote it to v2.
  const legacyRaw = localStorage.getItem(LEGACY_V1_PIN_KEY);
  const legacy = parseStored(legacyRaw);
  if (legacy && await verifyHash(pin, legacy)) {
    localStorage.setItem(PIN_KEY, JSON.stringify(legacy));
    localStorage.removeItem(LEGACY_V1_PIN_KEY);
    return true;
  }

  return false;
};
