/**
 * AES-256-GCM encryption helpers for storing OAuth tokens at rest.
 *
 * Key must be 32 bytes (256 bits) — provide as a 64-char hex string in
 * the ENCRYPTION_KEY environment variable.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_LEN = 12; // bytes — recommended for GCM
const AUTH_TAG_LEN = 16; // bytes

/**
 * Derive the key Buffer from the env variable or a deterministic fallback for
 * development.  Logs a warning in production if the key is not configured.
 */
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️  ENCRYPTION_KEY not set — OAuth tokens cannot be encrypted securely!"
    );
  }
  // Deterministic dev key — NOT secure, never use in production
  return Buffer.alloc(32, "vidion-dev-key");
}

/**
 * Encrypt a string value.
 * Returns a base64-encoded blob:  IV (12 bytes) + ciphertext + auth tag (16 bytes)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt a value previously encrypted with `encrypt()`.
 */
export function decrypt(blob: string): string {
  const key = getKey();
  const buf = Buffer.from(blob, "base64");

  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - AUTH_TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN, buf.length - AUTH_TAG_LEN);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(ciphertext) + decipher.final("utf8");
}

/** Safely parse encrypted JSON, returns null on failure. */
export function decryptJson<T = unknown>(blob: string | null | undefined): T | null {
  if (!blob) return null;
  try {
    return JSON.parse(decrypt(blob)) as T;
  } catch {
    return null;
  }
}

/** Encrypt a JSON-serialisable value. */
export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}
