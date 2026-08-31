const ADMIN_PIN_KEY = 'griyakas_admin_pin_v1';
const ITERATIONS = 120_000;

type StoredPin = { salt: string; hash: string; iterations: number };

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

const derive = async (pin: string, salt: Uint8Array, iterations: number) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256);
  return new Uint8Array(bits);
};

const constantTimeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
};

export const hasAdminPin = () => Boolean(localStorage.getItem(ADMIN_PIN_KEY));

export const setAdminPin = async (pin: string) => {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN harus 4-8 digit.');
  if (!crypto?.subtle) throw new Error('Browser tidak mendukung Web Crypto.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  const payload: StoredPin = { salt: bytesToBase64(salt), hash: bytesToBase64(hash), iterations: ITERATIONS };
  localStorage.setItem(ADMIN_PIN_KEY, JSON.stringify(payload));
};

export const verifyAdminPin = async (pin: string) => {
  const raw = localStorage.getItem(ADMIN_PIN_KEY);
  if (!raw || !crypto?.subtle) return false;
  try {
    const stored = JSON.parse(raw) as StoredPin;
    const actual = await derive(pin, base64ToBytes(stored.salt), stored.iterations || ITERATIONS);
    return constantTimeEqual(actual, base64ToBytes(stored.hash));
  } catch {
    return false;
  }
};

export const clearAdminPin = () => localStorage.removeItem(ADMIN_PIN_KEY);
